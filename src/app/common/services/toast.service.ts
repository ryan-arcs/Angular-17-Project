import { Injectable } from '@angular/core';
import { IndividualConfig, ToastrService } from 'ngx-toastr';

interface ToastrPayload {
  type: 'success' | 'error' | 'warning';
  title?: string;
  message: string;
  time?: number; //seconds
}

interface ToastConfig {
  ingnoreIncomingToasts?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  isToastIgnored = false;

  constructor(private toastr: ToastrService) {}

  fire(payload: ToastrPayload) {
    if(this.isToastIgnored){
      return;
    }

    const message = payload.message || '-';
    const title = payload.title || '';
    const override: Partial<IndividualConfig> = {
      positionClass: 'toast-bottom-right',
    };
    if (payload?.time) {
      //converted to milli seconds
      override.timeOut = payload.time * 1000;
    }

    if (payload.type === 'success') {
      this.toastr.success(message, title, override);
    } else if (payload.type === 'error') {
      this.toastr.error(message, title, override);
    } else if (payload.type === 'warning') {
      this.toastr.warning(message, title, override);
    }
  }
  
  updateToastConfig(req?: ToastConfig){
    if(req?.ingnoreIncomingToasts !== undefined){
      this.isToastIgnored = req?.ingnoreIncomingToasts;
    }  
  }
}

