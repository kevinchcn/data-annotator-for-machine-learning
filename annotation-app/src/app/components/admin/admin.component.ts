/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild } from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import { ClrDatagridStateInterface } from "@clr/angular";
import "rxjs/Rx";
import * as _ from "lodash";
import { Router } from "@angular/router";
import { UserAuthService } from "../../services/user-auth.service";
import { AvaService } from "../../services/ava.service";
import { User } from '../../model/user';
import { EnvironmentsService } from "app/services/environments.service";
import { Buffer } from 'buffer';
import { DatasetValidator } from "../../shared/form-validators/dataset-validator";

@Component({
  selector: "app-admin",
  templateUrl: "./admin.component.html",
  styleUrls: ["./admin.component.scss"]
})
export class AdminComponent implements OnInit {

  @ViewChild("dataGird", { static: false }) dataGird;
  @ViewChild("dataGirdUser", { static: false }) dataGirdUser;

  download: string;
  user: User;
  datasets: any = [];
  datasetClrDatagridStateInterface;
  deleteDatasetDialog: boolean = false;
  editProjectDialog: boolean = false;
  editUserRole: boolean = false;
  editUserDialog: boolean = false;
  createUserDialog: boolean = false;
  selectedDataset;
  previewImage: boolean = false;
  previewHeadDatas: any = [];
  previewContentDatas: any = [];
  isBrowsing: boolean;
  loading: boolean;
  errorMessage: string = "";
  infoMessage: string = "";
  tableState: ClrDatagridStateInterface;
  pageSize: number;
  page: number;
  totalItems: number;
  pageSizeUser: number;
  pageUser: number;
  totalUserItems: number;
  showAddNewDatasetDialog: boolean;
  showNewDatasetInfo: boolean;
  options: string = "";
  userRoleInfo: any = {};
  optionsSet: string = "";
  inputEmail: string = "";
  projectData: any = [];
  deleteUserDialog: boolean;
  selectedProjectDataset: any;
  notNumber: boolean;
  notTriggerNumber: boolean;
  minThreshold: boolean;
  minFrequency: boolean;
  inputAssigneeValidation: boolean;
  emailReg: boolean;
  emailRegForOwner: boolean;
  shareDatasets: boolean = false;
  inputDescription: string = "";
  unShareDatasets: boolean = false;
  inputDescriptionTip: boolean = false;
  shareDataComplete: boolean = false;
  downloadUrl: any;
  showDownloadDatasets: boolean = false;
  msg;
  msgGenerate;
  showGenerateDatasets: boolean = false;
  labelType: string = '';
  alForm: FormGroup;
  trigger: number = 50;
  frequency: number = 10;
  loadingSet: boolean = false;
  modelExist: boolean = false;
  msgEdit: any;
  setUserErrMessage: string;

  constructor(
    private router: Router,
    private userAuthService: UserAuthService,
    private avaService: AvaService,
    public env: EnvironmentsService,
    private formBuilder: FormBuilder



  ) {
    this.page = 1;
    this.pageSize = 10;
    this.pageUser = 1;
    this.pageSizeUser = 10;
    this.download = `${this.env.config.annotationService}/api`;

  }

  ngOnInit() {
    this.loading = false;
    this.user = this.userAuthService.loggedUser();
    this.getAllUsers();
    this.optionsSet = 'Admin';
    this.getProjects();
    this.inputAssigneeValidation = false;
    this.emailReg = true;
    this.emailRegForOwner = true;
    // this.downloadDatasets = false;
    this.notNumber = false;
    this.notTriggerNumber = false;
    this.minThreshold = false;
    this.minFrequency = false;
    this.createForm();

  }


  createForm(): void {
    this.alForm = this.formBuilder.group({
      frequency: [this.frequency, DatasetValidator.threshold()],
      trigger: [this.trigger, DatasetValidator.threshold()]

    });
  }

  valueChange(value: number) {
    this.pageSize = value;
    setTimeout(() => {
      this.dataGird.stateProvider.debouncer._change.next();
    }, 100);
  }


  valueChangeUser(value: number) {
    this.pageSizeUser = value;
    setTimeout(() => {
      this.dataGirdUser.stateProvider.debouncer._change.next();
    }, 100);
  }


  getProjects(params?: any) {
    this.loading = true;
    this.avaService.getProjects('admin').subscribe(res => {
      this.loading = false;
      for (let i = 0; i < res.length; i++) {
        res[i].isExtend = true
      }
      this.projectData = res;
      this.totalItems = res.length;
    }, (error: any) => {
      console.log(error);
      this.errorMessage = "Failed to load the datasets";
      this.loading = false;
    });
  }

  getAllUsers() {
    this.avaService.getAllUsers().subscribe(res => {
      this.loading = false;
      this.datasets = res;
      this.totalUserItems = res.length;
    }, (error: any) => {
      console.log(error);
      this.errorMessage = "Failed to load";
      this.loading = false;
    });
  }


  showProjectEdit(info) {
    this.msgEdit = info;
    this.msgEdit.src = "admin"
  }


  deleteDataset(data) {
    let param = {
      pid: data._id,
      pname: data.projectName
    }
    this.avaService.deleteProject(param).subscribe(res => {
      this.loading = false;
      this.infoMessage = 'Success to delete the project';
      this.getProjects();
      setTimeout(() => {
        this.infoMessage = '';
      }, 1000);
    }, (error: any) => {
      console.log(error);
      this.errorMessage = "Failed to delete";
      this.loading = false;
      setTimeout(() => {
        this.errorMessage = '';
      }, 1000);
    });
  }


  changeSetRadio(e) {
    this.optionsSet = e.target.value;
  }



  saveRoleCreate() {
    if (!this.inputEmail) {
      this.setUserErrMessage = 'This field is required';
    } else {
      let emailReg;
      if (!this.env.config.authUrl) {
        this.setUserErrMessage = '';
        emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.inputEmail);
        if (!emailReg) {
          this.setUserErrMessage = 'Wrong format! Only accept email address';
        }
      } else {
        emailReg = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@vmware.com$/.test(this.inputEmail);
        if (!emailReg) {
          this.setUserErrMessage = 'Wrong format! Email only accept vmware emailbox';
        }
      };
      if (emailReg) {
        this.setUserErrMessage = '';
        let str = this.inputEmail.split('@')[0];
        this.userRoleInfo = {
          email: this.inputEmail,
          role: this.optionsSet,
          name: str.replace(str[0], str[0].toUpperCase())
        }
        this.avaService.saveUser(this.userRoleInfo).subscribe(res => {
          this.loading = false;
          this.createUserDialog = false;
          this.infoMessage = 'Success to create the user role';
          this.getAllUsers();
          setTimeout(() => {
            this.infoMessage = '';
          }, 1000);
        }, (error: any) => {
          console.log(error);
          this.errorMessage = "Failed to create";
          this.loading = false;
          this.createUserDialog = false;

        });
      }
    }


  }

  selectedUser(info) {
    this.options = info.role;
    this.userRoleInfo = {
      role: '',
      user: info.email
    }
  }


  changeRadio(e) {
    this.options = e.target.value;
  }


  saveRoleEdit() {
    this.loading = true;
    this.userRoleInfo.role = this.options;
    this.avaService.saveRoleEdit(this.userRoleInfo).subscribe(res => {
      this.loading = false;
      this.infoMessage = 'Success to modify the user role';
      this.getAllUsers();
      setTimeout(() => {
        this.infoMessage = '';
      }, 1000);
    }, (error: any) => {
      console.log(error);
      this.errorMessage = "Failed to save";
      this.loading = false;
    });
  }


  deleteUser(info) {
    let param = {
      uid: info._id
    }
    this.avaService.deleteUser(param).subscribe(res => {
      this.loading = false;
      this.infoMessage = 'Success to delete the user';
      this.getAllUsers();
      setTimeout(() => {
        this.infoMessage = '';
      }, 1000);
    }, (error: any) => {
      console.log(error);
      this.errorMessage = "Failed to save";
      this.loading = false;
      setTimeout(() => {
        this.errorMessage = '';
      }, 1000);
    });
  }


  generateProject(e) {

    if (e.labelType == 'numericLabel') {
      for (let i = 0; i < this.projectData.length; i++) {
        if (this.projectData[i].id == e.id) {
          this.projectData[i].generateInfo.status = 'generating';
        }
      };
      this.avaService.generate(e.id, this.user.email, 'standard', 'admin').subscribe(res => {
        if (res && res.Info != 'undefined') {
          if (res.Info == 'prepare') {
            this.infoMessage = 'Dataset with annotations is being generated. You will receive an email when download is ready.';
          } else if (res.Info == 'done') {
            for (let i = 0; i < this.projectData.length; i++) {
              if (this.projectData[i].id == e.id) {
                this.projectData[i].generateInfo.status = 'done'
              }
            }
            this.downloadUrl = new Buffer(res.Body.file, 'base64').toString();
            this.downloadProject();
          } else if (res.Info == 'generating') {
            this.infoMessage = 'Dataset with annotations is already being generated. Please refresh the page.';
            this.getProjects();
          }
          setTimeout(() => {
            this.infoMessage = '';
          }, 5000);
        }
      }, (error: any) => {
        console.log(error);
        this.loading = false;
      });
    } else {
      this.showGenerateDatasets = true;
      e.src = 'admin';
      if (e.projectType == 'log') {
        this.avaService.downloadProject(e.id).subscribe(res => {
          if (res) {
            e.originalDataSets = res.originalDataSets;
            this.msgGenerate = e;
          }
        }, (error: any) => {
          console.log(error);
          this.showGenerateDatasets = false;
        });
      } else {
        this.msgGenerate = e;
      }
    }
  }


  clickDownload(e) {
    this.showDownloadDatasets = true;
    this.avaService.downloadProject(e.id).subscribe(res => {
      if (res) {
        this.msg = {
          selectedDownloadFile: e.dataSource,
          latestAnnotationTime: e.updatedDate,
          generateDoneTime: res.updateTime,
          format: res.format,
          downloadUrl: new Buffer(res.file, 'base64').toString(),
          datasets: this.datasets,
          id: e.id,
          projectName: e.projectName,
          labelType: e.labelType,
          projectType: e.projectType,
          src: 'admin',
          originalDataSets: res.originalDataSets
        };

      }
    }, (error: any) => {
      console.log(error);
      this.loading = false;
    });

  }


  downloadProject() {
    window.location.href = this.downloadUrl;
  }



  isShare(shareStatus) {
    if (shareStatus == true) {
      this.unShareDatasets = true;
    } else {
      this.shareDatasets = true;
    }
  }


  toggleShare(data) {
    let flag = this.inputDescription.replace(/(\r\n|\n|\r)/gm, "")
    if (data.shareStatus == false && flag.trim() == '') {
      this.inputDescriptionTip = true;
      return;
    } else if ((data.shareStatus == false && flag.trim() != '') || data.shareStatus == true) {
      this.shareDataComplete = true;
      let param = {
        pid: data._id,
        share: !data.shareStatus,
        shareDescription: this.inputDescription
      }
      this.avaService.shareStatus(param).subscribe(res => {
        if (res && res.shareStatus == true) {
          this.infoMessage = 'Sharing the annotated data successful.';
          setTimeout(() => {
            this.infoMessage = '';
          }, 2000);
        };
        this.getProjects();
        this.shareDatasets = false;
        this.unShareDatasets = false;
        this.inputDescription = '';
        this.inputDescriptionTip = false;
        this.shareDataComplete = false;
      })
    }
  }


  more(id) {
    for (let i = 0; i < this.projectData.length; i++) {
      if (this.projectData[i].id == id) {
        this.projectData[i].isExtend = !this.projectData[i].isExtend;
      }
    }
  }


  cancelShare() {
    this.shareDatasets = false;
    this.inputDescriptionTip = false;
    this.shareDataComplete = false;
    this.inputDescription = '';
  }


  checkAddStatus(id, projectName, projectType) {
    for (let i = 0; i < this.projectData.length; i++) {
      if (this.projectData[i].id == id) {
        this.projectData[i].appendSr = 'adding';
        break;
      }
    };
    if (projectType == 'image') {
      this.router.navigate(['appendNewEntries'], { queryParams: { id: id, name: projectName, from: 'admin', projectType: projectType } })
    } else if (projectType == 'log') {
      this.router.navigate(['appendNewEntries'], { queryParams: { id: id, name: projectName, from: 'admin', projectType: projectType } })

    } else {
      this.avaService.getSample(id).subscribe(res => {
        if (res.appendSr == 'adding') {
          this.infoMessage = 'New entries is being inserted, please wait.';
          this.getProjects();
          setTimeout(() => {
            this.infoMessage = '';
          }, 10000);
        } else if (res.appendSr == 'done') {
          this.infoMessage = 'New entries has been added, please update first.';
          this.getProjects();
          setTimeout(() => {
            this.infoMessage = '';
          }, 10000);
        } else if (res.appendSr == 'pending') {
          this.router.navigate(['appendNewEntries'], { queryParams: { id: id, name: projectName, from: 'admin', projectType: projectType } })
        }
      }, (error: any) => {
        console.log(error);
      });
    }

  };


  availableNewEntry(id, projectName, projectType) {
    for (let i = 0; i < this.projectData.length; i++) {
      if (this.projectData[i].id == id) {
        this.projectData[i].appendSr = 'adding';
        break;
      }
    }
    if (projectType == 'image') {
      this.router.navigate(['appendNewEntries'], { queryParams: { id: id, name: projectName, from: 'admin', projectType: projectType } })
    } else if (projectType == 'log') {
      this.router.navigate(['appendNewEntries'], { queryParams: { id: id, name: projectName, from: 'admin', projectType: projectType } })
    } else {
      this.avaService.getSample(id).subscribe(res => {
        if (res.appendSr == 'adding') {
          this.infoMessage = 'New entries is being inserted, please wait.';
          this.getProjects();
          setTimeout(() => {
            this.infoMessage = '';
          }, 10000);
        } else if (res.appendSr == 'pending' || res.appendSr == 'done') {
          this.router.navigate(['appendNewEntries'], { queryParams: { id: id, name: projectName, from: 'admin', projectType: projectType } })
        }
      }, (error: any) => {
        console.log(error);
      });
    }

  };



  receiveCloseDownloadInfo(e) {
    this.showDownloadDatasets = false;
    this.msg = null;
    this.msgGenerate = null;
  };


  receiveCloseGenerateInfo(e) {
    this.showGenerateDatasets = false;
  };


  receiveGenerateInfo(e) {

    if (e && e.Info != 'undefined') {

      e.Modal == 'generateDownload' ? this.showDownloadDatasets = false : this.showGenerateDatasets = false;
      if (e.Info == 'prepare') {
        this.infoMessage = 'Dataset with annotations is being generated. You will receive an email when download is ready.';
        this.getProjects();
      } else if (e.Info == 'done') {
        this.infoMessage = 'Dataset with annotations is already been generated. Please refresh the page.';
        this.downloadUrl = new Buffer(e.Body.file, 'base64').toString();
        this.downloadProject();
        this.getProjects();
      } else if (e.Info == 'generating') {
        this.infoMessage = 'Dataset with annotations is already being generated. Please refresh the page.';
        this.getProjects();
      }
      setTimeout(() => {
        this.infoMessage = '';
      }, 5000);
      this.msg = null;
      this.msgGenerate = null;
    };
  };



  clickToPreview(dataset) {
    this.router.navigate(['admin/preview'], { queryParams: { name: dataset.projectName, labelType: dataset.labelType, id: dataset.id, projectType: dataset.projectType, estimator: dataset.al.estimator, threshold: dataset.al.trigger, frequency: dataset.al.frequency, isMultipleLabel: dataset.isMultipleLabel } });
  };


  receiveCloseEdit(e) {
    this.editProjectDialog = false;
  };


  receiveSubmitEdit(e) {
    this.editProjectDialog = false;
    e ? this.infoMessage = 'Success to edit the project' : this.errorMessage = "Failed to edit";
    this.getProjects();
    setTimeout(() => {
      this.infoMessage = '';
      this.errorMessage = '';
    }, 1000);
  }


  receiveDeleteLabel(e) {
    this.getProjects();
  }




}

