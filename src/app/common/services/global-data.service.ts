import { Injectable } from '@angular/core';
import { UIService } from './ui.service';
import { ToastService } from './toast.service';
import { environment } from 'src/environments/environment';
import { RestApiService } from './rest-api.service';
import { BehaviorSubject } from 'rxjs';
import { UserProfileService } from './user-profile.service';
import { PermittedApplicationService } from './permitted-appolication.service';

interface DbRequest {
  tableModel: any;
  filter?: any;
  selectionSet?: any;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalDataService {
  private client: any = '';

  dbRecordsLimit = Number(environment.dbRecordsLimit) || 100000;

  constructor(
    private uiService: UIService,
    private toastService: ToastService,
    private restApiService: RestApiService,
    private userProfileService: UserProfileService,
    private permittedApplicationService: PermittedApplicationService
  ) {}

  async tableRecords(dbRequest: DbRequest) {
    let results: any[] = [];
    let nextToken = null;
    do {
      const { data, nextToken: nt } = (await dbRequest.tableModel.list({
        limit: this.dbRecordsLimit,
        nextToken,
        filter: dbRequest.filter,
        selectionSet: dbRequest.selectionSet,
      })) as any;
      nextToken = nt;
      results = results.concat(data || []);
    } while (nextToken);
    return results;
  }

  async fetchPermissions(userId: string) {
    const permissions = `
    query listUserRolePermissions($limit: Int, $parentNextToken: String, $childNextToken: String) {
      listUserRolePermissions(
        limit: $limit,
        nextToken: $parentNextToken,
        filter: {userId: {eq: "${userId}"}, isDeleted: {ne: true}}
      ) {
        items {
          role {
            id
            isActive
            isDeleted
            rolePermissions(nextToken: $childNextToken, limit: $limit) {
              items {
                isDeleted
                permission {
                  id
                  isActive
                  isDeleted
                  slug
                  module {
                    id
                    isActive
                    isDeleted
                    slug
                    application {
                      id
                      isActive
                      isDeleted
                      slug
                      name
                      logo
                      sortOrder
                    }
                  }
                  submodule {
                    id
                    isActive
                    isDeleted
                    slug
                  }
                }
              }
              nextToken
            }
          }
          permission {
            id
            isActive
            isDeleted
            slug
            module {
              id
              isActive
              isDeleted
              slug
              application {
                id
                isActive
                isDeleted
                slug
                name
                logo
                sortOrder
              }
            }
            submodule {
              id
              isActive
              isDeleted
              slug
            }
          }
        }
        nextToken
      }
    }
  `;

    let results: any[] = [];
    let parentNextToken: string | null = null;

    do {
      const result = (await this.client.graphql({
        query: permissions,
        variables: {
          limit: this.dbRecordsLimit,
          parentNextToken: parentNextToken,
          childNextToken: null, // Always start with null for child pagination on new parent page
        },
      })) as any;

      // Process items with proper async handling
      const processedItems = await Promise.all(
        (result.data.listUserRolePermissions.items || []).map(
          async (item: any) => {
            const thisRole = item?.role;
            if (!thisRole?.id) {
              return item; // Return original item if role data is invalid
            }

            let rolePermissions = item?.role?.rolePermissions?.items || [];
            let childNextToken = item?.role?.rolePermissions?.nextToken;

            // Paginate through child rolePermissions
            while (childNextToken) {
              const childResult = (await this.client.graphql({
                query: permissions,
                variables: {
                  limit: this.dbRecordsLimit,
                  parentNextToken: parentNextToken,
                  childNextToken: childNextToken,
                },
              })) as any;

              // Find the matching role in the response
              const matchingRoleItem =
                childResult.data.listUserRolePermissions.items?.find(
                  (childItem: any) => childItem?.role?.id === thisRole.id,
                );

              if (matchingRoleItem?.role?.rolePermissions?.items) {
                rolePermissions = rolePermissions.concat(
                  matchingRoleItem.role.rolePermissions.items,
                );
              }

              // Update childNextToken from the new result
              childNextToken =
                matchingRoleItem?.role?.rolePermissions?.nextToken || null;
            }

            return {
              ...item,
              role: {
                ...item.role,
                rolePermissions,
              },
            };
          },
        ),
      );

      results = results.concat(processedItems);
      parentNextToken = result.data.listUserRolePermissions.nextToken;
    } while (parentNextToken);

    return results;
  }

  getPagedData(
    data: any,
    searchTerm: string,
    columnFilters: any,
    pagination: any,
    sort: any,
    customFieldResolver: any = null,
  ) {
    const normalize = (term: any) => {
      // this is case where product owner and it contact, system owner....
      if (Array.isArray(term)) {
        return term
          .map(
            (item) =>
              `${item?.fullname_preferred} ${item?.email} ${item?.network_id}`,
          )
          .join('')
          .toString()
          .trim()
          .toLowerCase();
      }
      return (term || '').toString().trim().toLowerCase();
    };

    let filteredData = [...data];

    // Apply search filter
    if (searchTerm) {
      const term = normalize(searchTerm);
      filteredData = filteredData.filter((item) => {
        const values = Object.keys(item).map((key) => {
          const value = customFieldResolver
            ? customFieldResolver(item, key)
            : item[key];
          return normalize(value);
        });
        return values.some((val) => val.includes(term));
      });
    }

    // Apply column filters
    if (columnFilters && columnFilters.length > 0) {
      filteredData = filteredData.filter((item) => {
        return columnFilters.every((filter: any) => {
          if (!filter.conditions || filter.conditions.length === 0) return true;

          const value = customFieldResolver
            ? customFieldResolver(item, filter.columnName)
            : item[filter.columnName];
          const fieldValue = normalize(value);

          const results = filter.conditions.map((condition: any) => {
            switch (condition.type) {
              case 'contains':
                return condition.searchTags.some((tag: any) =>
                  fieldValue.includes(normalize(tag)),
                );
              case 'does_not_contain':
                return condition.searchTags.every(
                  (tag: any) => !fieldValue.includes(normalize(tag)),
                );
              case 'equals':
                return condition.searchTags.some(
                  (tag: any) => fieldValue === normalize(tag),
                );
              case 'does_not_equal':
                return condition.searchTags.every(
                  (tag: any) => fieldValue !== normalize(tag),
                );
              case 'begins_with':
                return condition.searchTags.some((tag: any) =>
                  fieldValue.startsWith(normalize(tag)),
                );
              case 'ends_with':
                return condition.searchTags.some((tag: any) =>
                  fieldValue.endsWith(normalize(tag)),
                );
              case 'is_blank':
                return !fieldValue;
              case 'is_not_blank':
                return !!fieldValue;
              default:
                return true;
            }
          });

          return filter.operator === 'and'
            ? results.every(Boolean)
            : results.some(Boolean);
        });
      });
    }

    // Apply sorting
    if (sort && sort.prop) {
      filteredData.sort((a, b) => {
        const aValue = customFieldResolver
          ? customFieldResolver(a, sort.prop)
          : a[sort.prop];
        const bValue = customFieldResolver
          ? customFieldResolver(b, sort.prop)
          : b[sort.prop];

        const aVal = (aValue || '').toString().toLowerCase();
        const bVal = (bValue || '').toString().toLowerCase();

        if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const totalCount = filteredData.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const startIndex = (pagination.pageNumber - 1) * pagination.pageSize;
    const endIndex = Math.min(startIndex + pagination.pageSize, totalCount);
    const pagedData = filteredData.slice(startIndex, endIndex);
    return {
      data: pagedData,
      totalCount: totalCount,
      totalPages: totalPages,
      errorMessage: pagedData.length
        ? ''
        : 'Oops! We couldn’t find any records.',
      completedFilterData: filteredData || [],
    };
  }

  async getLoginUser(payload?: { email: string; password?: string }) {
    {
      this.uiService.setLoader(true);
      try {
        const response = await this.restApiService.postRequest({
          path: 'login',
          body: {
            email: payload?.email,
            password: payload?.password,
          },
        }) as any;
        this.toastService.fire({
          type: 'success',
          message: response?.statusDescription || 'Success!',
        });
        localStorage.setItem('auth_token', response?.data?.token);
        return response;
      } catch (error: any) {
        console.error('Login Error:', error);
        this.toastService.fire({
          type: 'error',
          message:
            error?.statusDescription ||
            (typeof error === 'string' && error) ||
            error?.response?.data?.statusDescription ||
            'Something went wrong',
        });
        return [];
      } finally {
        this.uiService.setLoader(false);
      }
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.userProfileService.clearLoggedInUserData();
    this.permittedApplicationService.clearPermittedApplications();
    this.toastService.fire({
      type: 'success',
      message: 'Logout Successfully!',
    });
  }
  
}
