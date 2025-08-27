interface ColumnRequest {
  columnValue?: boolean;
}

export const recordsPerPage = {
  sizes: [25, 50, 100, 150, 200],
  defaultSize: 25,
};

export const getStatusColumn = (columnRequest?: ColumnRequest) => {
  return `<div class="sell-outer">
  <div class="circul-status" style = "background-color: ${columnRequest?.columnValue ? 'green' : 'red'};">
  </div>
  <span class="top-1">${columnRequest?.columnValue ? 'Active' : 'Inactive'}</span>
  </div>`;
};
