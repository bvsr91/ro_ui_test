sap.ui.define(
    [
        "./BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/ui/model/Filter",
        "sap/ui/model/Sorter",
        "sap/ui/model/FilterOperator",
        "sap/m/GroupHeaderListItem",
        "sap/ui/Device",
        "sap/ui/core/Fragment",
        "../model/formatter",
        "sap/ui/table/RowAction",
        "sap/ui/table/RowActionItem",
        "sap/ui/table/RowSettings",
        "sap/m/MessageBox",
        "./modules/utilController",
        "sap/m/Dialog",
        "sap/m/Button",
        "sap/m/Label",
        "sap/m/library",
        "sap/m/MessageToast",
        "sap/m/Text",
        "sap/m/TextArea",
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem,
        Device, Fragment, formatter, RowAction, RowActionItem, RowSettings, MessageBox, utilController,
        Dialog, Button, Label, mobileLibrary, MessageToast, Text, TextArea) {
        "use strict";
        // shortcut for sap.m.ButtonType
        var ButtonType = mobileLibrary.ButtonType;
        // shortcut for sap.m.DialogType
        var DialogType = mobileLibrary.DialogType;
        return BaseController.extend("com.ferrero.zmrouiapp.controller.VendorNotifications", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("vendNoti").attachPatternMatched(this._onRouteMatched, this);
                var that = this;
                var oHashChanger = new sap.ui.core.routing.HashChanger.getInstance();
                oHashChanger.attachEvent("hashChanged", function (oEvent) {
                    that.routeAuthValidation(oHashChanger.getHash());
                });
                this.extendTable();
                // this.getRouter().attachBypassed(this.onBypassed, this);
            },

            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            /**
             * Event handler for navigating back.
             * We navigate back in the browser historz
             * @public
             */
            onNavBack: function () {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            },

            /* =========================================================== */
            /* begin: internal methods                                     */
            /* =========================================================== */

            _onRouteMatched: function () {
                //Set the layout property of the FCL control to 'OneColumn'
                // this.getModel("appView").setProperty("/layout", "OneColumn");
                this.setSelKey("vendNoti");
                this.getView().byId("idSTabVendorNoti").rebindTable(true);
            },
            onBeforeRebindTable: async function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams"),
                    // oSmtFilter = this.getView().byId("idSTabPrcingNoti"),
                    oModel = this.getOwnerComponent().getModel(),
                    sTabSelKey = this.getView().byId("idIconTabBar").getSelectedKey();
                var oUserModel = this.getOwnerComponent().getModel("userModel");
                var role = oUserModel.getData().role;
                // var aTokens = oObjId.getTokens();
                this._sEntitySet;

                var sFieldName;
                if (!role) {
                    this.getUserDetails().then();
                    await this.validateUser();
                }

                if (role.role_role) {
                    if (role.role_role === "CDT" || role.role_role === "LDT") {
                        // sFieldName = "createdBy";
                        this.getView().byId("idSTabVendorNoti").setEntitySet("VendorNotifications_U");
                        this._sEntitySet = "VendorNotifications_U";
                    } else {
                        // sFieldName = "approver"
                        this.getView().byId("idSTabVendorNoti").setEntitySet("VendorNotifications_A");
                        this._sEntitySet = "VendorNotifications_A";
                    }
                }
                if (sTabSelKey !== "All" && sTabSelKey !== "") {
                    mBindingParams.filters.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
                }

                oModel.attachRequestFailed(this._showError, this);
                oModel.attachRequestCompleted(this._detach, this);
            },
            _showError: function (oResponse) {
                var oModel = this.getView().getModel(),
                    oMsgs = oResponse.getSource().getMessagesByEntity("/" + this._sEntitySet);
                if (oMsgs[0]) {
                    MessageBox.error(oMsgs[0].message);
                    oModel.detachRequestFailed(this._showError, this);
                }
            },
            _detach: function (oEvent) {
                var oModel = this.getView().getModel();
                if (oEvent.getParameter("success") === true) {
                    oModel.detachRequestFailed(this._showError, this);
                }
                oModel.detachRequestCompleted(this._detach, this);
            },
            onFilterSelect: function (oEvent) {
                var sKey = oEvent.getParameter("key");
                this.getView().byId("idSTabVendorNoti").rebindTable(true);
            },
            extendTable: function () {
                var oTable = this.byId("idUiTabVendorNoti");
                var fnPress = this.handleActionPress.bind(this);
                var oTemplate = oTable.getRowActionTemplate();
                if (oTemplate) {
                    oTemplate.destroy();
                    oTemplate = null;
                }
                var iCount;
                this.modes = [
                    {
                        key: "Multi",
                        text: "Multiple Actions",
                        handler: function () {
                            var oTemplate = new RowAction({
                                items: [
                                    new RowActionItem({ icon: "sap-icon://action", text: "Action", press: fnPress })
                                ]
                            });
                            return [1, oTemplate];
                        }
                    }
                ];
                for (var i = 0; i < this.modes.length; i++) {
                    if ("Multi" == this.modes[i].key) {
                        var aRes = this.modes[i].handler();
                        iCount = aRes[0];
                        oTemplate = aRes[1];
                        break;
                    }
                }
                oTable.setRowActionTemplate(oTemplate);
                oTable.setRowActionCount(iCount);
            },
            handleActionPress: function (oEvent) {
                var oInput = oEvent.getSource().getParent();
                var bEdit;
                var bDelete;
                var oRecordCreator = oInput.getBindingContext().getObject().createdBy;
                var oRecordApprover = oInput.getBindingContext().getObject().approver;
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (logOnUserObj.userid && oRecordApprover.toLowerCase() === logOnUserObj.userid.toLowerCase() && (logOnUserObj.role_role === "GCM" ||
                    logOnUserObj.role_role === "LP")) {
                    if (oInput.getBindingContext().getObject().status_code === "Approved" ||
                        oInput.getBindingContext().getObject().status_code === "Rejected") {
                        bEdit = false;
                    } else {
                        bEdit = true;
                    }

                } else {
                    bEdit = false;
                }
                var oActionSheet = new sap.m.ActionSheet({
                    placement: "VerticalPreferredBottom",
                    buttons: [
                        new sap.m.Button({
                            text: 'Approve', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressApprove.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Reject', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressReject.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'History', type: 'Transparent', width: '6rem',
                            press: this.onHistoryClick.bind(this, oInput)
                        })
                    ]
                });
                oActionSheet.openBy(oInput);
            },
            onHistoryClick: async function (oInput) {
                var sPath = oInput.getBindingContext().getPath;
                var oSelObj = oInput.getBindingContext().getObject();
                var oModel = this.getOwnerComponent().getModel();
                // const info = await $.get(oModel.sServiceUrl + '/VendorComments?');
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(this.createId("FrgVendorComments"), "com.ferrero.zmrouiapp.view.fragments.VendorHistory", this);
                    this.getView().addDependent(this._oDialog);
                }
                var oList = this.byId(Fragment.createId("FrgVendorComments", "idListVendComment"));
                var aFilter = [];
                aFilter.push(new Filter("Vendor_List_manufacturerCode", FilterOperator.EQ, oSelObj.Vendor_List_manufacturerCode, true));
                aFilter.push(new Filter("Vendor_List_localManufacturerCode", FilterOperator.EQ, oSelObj.Vendor_List_localManufacturerCode, true));
                aFilter.push(new Filter("Vendor_List_countryCode_code", FilterOperator.EQ, oSelObj.Vendor_List_countryCode_code, true));
                oList.getBinding("items").filter(aFilter);
                this._oDialog.open();
            },
            onCloseCommentsData: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                    this._oDialog = undefined;
                }

            },
            onPressApprove: async function (oInput) {
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    uuid: oSelObj.uuid,
                    Vendor_List_manufacturerCode: oSelObj.Vendor_List_manufacturerCode,
                    Vendor_List_countryCode_code: oSelObj.Vendor_List_countryCode_code,
                    Vendor_List_localManufacturerCode: oSelObj.Vendor_List_localManufacturerCode,
                    completionDate: new Date().toISOString(),
                    approvedDate: new Date().toISOString(),
                    approver: logOnUserObj.userid,
                    status_code: "Approved"
                };
                var oPayLoadVL = {
                    status_code: "Approved"
                };
                var sPath = "/VendorNotifications(guid'" + oSelObj.uuid + "')";
                sap.ui.core.BusyIndicator.show();
                const info = await this.updateVendorRecord(oModel, sPath, oActionUriParameters);
                if (info.status_code) {
                    MessageBox.success("Record Approved Successfully");
                }
                sap.ui.core.BusyIndicator.hide();

                // oModel.callFunction("/approvePricing", {
                //     method: "POST",
                //     urlParameters: oActionUriParameters,
                //     success: function (oData) {
                //         this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                //         this._oPopover.close();
                //         // debugger;
                //     }.bind(this),
                //     error: function (error) {
                //         // debugger;
                //     }
                // });
            },
            updateVendorRecord: function (oModel, sPath, oPayLoad) {
                return new Promise(function (resolve, reject) {
                    oModel.update(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabVendorNoti").rebindTable(true);
                            // this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            resolve(error);
                        }
                    });
                }.bind(this));
            },
            onPressReject: function (oInput) {
                var oDialogRej = this.createDialog(oInput);
                oDialogRej.open();
            },
            createDialog: function (oInput) {
                var oSelObj = oInput.getBindingContext().getObject();
                if (this.oRejectDialog) {
                    this.oRejectDialog.destroy();
                    this.oRejectDialog = undefined;
                }
                if (!this.oRejectDialog) {
                    this.oRejectDialog = new Dialog({
                        title: "Reject",
                        type: DialogType.Message,
                        content: [
                            new Label({
                                text: "Do you want to reject " + oSelObj.Vendor_List_manufacturerCode + "?",
                                labelFor: "rejectionNote",
                            }),
                            new TextArea("rejectionNote", {
                                width: "100%",
                                placeholder: "Add note (required)",
                                liveChange: function (oEvent) {
                                    var sText = oEvent.getParameter("value");
                                    this.oRejectDialog
                                        .getBeginButton()
                                        .setEnabled(sText.length > 0);
                                }.bind(this),
                            }),
                        ],
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "Reject",
                            enabled: false,
                            press: this.onRejOk.bind(this, oInput),
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                this.oRejectDialog.close();
                            }.bind(this),
                        }),
                    });
                }
                return this.oRejectDialog;

            },
            onRejOk: async function (oInput) {
                var sText = sap.ui.getCore().byId("rejectionNote").getValue();
                var oModel = this.getOwnerComponent().getModel();
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    vendor_Notif_uuid: oSelObj.uuid,
                    Vendor_List_manufacturerCode: oSelObj.Vendor_List_manufacturerCode,
                    Vendor_List_countryCode_code: oSelObj.Vendor_List_countryCode_code,
                    Vendor_List_localManufacturerCode: oSelObj.Vendor_List_localManufacturerCode,
                    Comment: sText
                };
                var oPayLoadVL = {
                    status_code: "Rejected"
                };
                sap.ui.core.BusyIndicator.show();
                const info = await this.createVendorComment(oModel, "/VendorComments", oActionUriParameters);
                if (info.status_code) {
                    MessageBox.success("Record Rejected Successfully");
                }
                sap.ui.core.BusyIndicator.hide();

                this.oRejectDialog.close();
            },
            createVendorComment: function (oModel, sPath, oPayLoad) {
                return new Promise(function (resolve, reject) {
                    oModel.create(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabVendorNoti").rebindTable(true);
                            // this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            resolve(error);
                        }
                    });
                }.bind(this));
            },
            onRowlSelChange: function (oEvent) {
                // var oSelObj = oEvent.getParameter("rowContext").getObject();
                var oRole = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var iIndex = oEvent.getParameter("rowIndex");
                if (oEvent.getParameters().selectAll) {
                    var aSelectedIndices = oEvent.getSource().getSelectedIndices();
                    for (var a = 0; a < aSelectedIndices.length; a++) {
                        if (oEvent.getSource().getContextByIndex(a).getObject()) {
                            var oRowObj = oEvent.getSource().getContextByIndex(a).getObject();
                            if (oRowObj.approver !== oRole.userid || oRowObj.status_code !== "Pending") {
                                oEvent.getSource().removeSelectionInterval(a, a);
                            }
                        }
                    }
                } else {
                    var aSelectedIndices = oEvent.getSource().getSelectedIndices();
                    for (var a of aSelectedIndices) {
                        if (oEvent.getSource().getContextByIndex(a).getObject()) {
                            var oRowObj = oEvent.getSource().getContextByIndex(a).getObject();
                            if (oRowObj.approver !== oRole.userid || oRowObj.status_code !== "Pending") {
                                oEvent.getSource().removeSelectionInterval(a, a);
                            }
                        }
                    }
                    // if (oSelObj.approver !== oRole.userid || oSelObj.status_code !== "Pending") {
                    //     // var iIndex = oEvent.getSource().getSelectedIndices().indexOf(oEvent.getSource().getSelectedIndex());
                    //     // oEvent.getSource().getSelectedIndices().splice(iIndex, 1);
                    //     oEvent.getSource().removeSelectionInterval(iIndex, iIndex);
                    // }
                }
            },
            handleApprove: function (oEvent) {
                var oTable = this.getView().byId("idUiTabVendorNoti"),
                    aSelectedIndices = oTable.getSelectedIndices(),
                    aRows = oTable.getRows(),
                    aPayLoad = [];
                if (aSelectedIndices.length > 0) {
                    for (var a of aSelectedIndices) {
                        aPayLoad.push(oTable.getContextByIndex(a).getObject());
                    }
                    this.batchUpdateRecords(aPayLoad);
                } else {
                    MessageBox.warning("Please select atleast one Row");
                    return;
                }
            },
            batchUpdateRecords: function (aData) {
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                sap.ui.core.BusyIndicator.show();
                var that = this;
                var iCounter = 1;
                oModel.setUseBatch(true);
                oModel.attachBatchRequestCompleted(function (dataBatch) {
                    jQuery.sap.log.info("attachBatchRequestCompleted - success");
                    that.getView().byId("idUiTabVendorNoti").setBusy(false);
                    if (iCounter === 1) {
                        that.getOwnerComponent().getModel().refresh();
                        iCounter += 1;
                    }
                    sap.ui.core.BusyIndicator.hide();
                });
                oModel.attachBatchRequestFailed(function (e) {
                    jQuery.sap.log.info("attachBatchRequestFailed - fail: " + e);
                    that.getView().byId("idUiTabVendorNoti").setBusy(false);
                    that.getOwnerComponent().getModel().refresh();
                    // that.getView().getModel().refresh();
                    sap.ui.core.BusyIndicator.hide();
                });
                for (var a of aData) {
                    var oActionUriParameters = {
                        uuid: a.uuid,
                        Vendor_List_manufacturerCode: a.Vendor_List_manufacturerCode,
                        Vendor_List_countryCode_code: a.Vendor_List_countryCode_code,
                        Vendor_List_localManufacturerCode: a.Vendor_List_localManufacturerCode,
                        completionDate: new Date().toISOString(),
                        approvedDate: new Date().toISOString(),
                        approver: logOnUserObj.userid,
                        status_code: "Approved"
                    };
                    oModel.update("/VendorNotifications(guid'" + a.uuid + "')", oActionUriParameters, {
                        method: "PUT",
                        success: function (dataRes) {
                            // objectLastRes = dataRes;
                            //jQuery.sap.log.info("create - success");
                        },
                        error: function (e) {
                            jQuery.sap.log.error("create - error");
                            var textMsg = e.statusText;
                            textMsg = textMsg.split("|").join("\n");
                            // that.makeResultDialog("Error", "Error", textMsg).open();
                            isSuccess = false;
                        }
                    });
                }
            },
            handleReject: function () {
                // var oSelObj = oInput.getBindingContext().getObject();
                var oTable = this.getView().byId("idUiTabVendorNoti"),
                    aSelectedIndices = oTable.getSelectedIndices(),
                    aRows = oTable.getRows(),
                    aPayLoad = [];
                if (aSelectedIndices.length > 0) {
                    for (var a of aSelectedIndices) {
                        aPayLoad.push(oTable.getContextByIndex(a).getObject());
                    }
                    // this.batchUpdateRecords(aPayLoad);
                } else {
                    MessageBox.warning("Please select atleast one Row");
                    return;
                }

                if (this.oRejectDialog) {
                    this.oRejectDialog.destroy();
                    this.oRejectDialog = undefined;
                }
                if (!this.oRejectDialog) {
                    this.oRejectDialog = new Dialog({
                        title: "Reject",
                        type: DialogType.Message,
                        content: [
                            new Label({
                                text: "Do you want to reject ?",
                                labelFor: "rejectionNote",
                            }),
                            new TextArea("rejectionNote", {
                                width: "100%",
                                placeholder: "Add note (required)",
                                liveChange: function (oEvent) {
                                    var sText = oEvent.getParameter("value");
                                    this.oRejectDialog
                                        .getBeginButton()
                                        .setEnabled(sText.length > 0);
                                }.bind(this),
                            }),
                        ],
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "Reject",
                            enabled: false,
                            press: this.onBatchRejOk.bind(this, aPayLoad),
                        }),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                this.oRejectDialog.close();
                            }.bind(this),
                        }),
                    });
                }
                this.oRejectDialog.open();
            },
            onBatchRejOk: function (aData) {
                var sText = sap.ui.getCore().byId("rejectionNote").getValue();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var that = this,
                    iCounter = 1;
                sap.ui.core.BusyIndicator.show();
                oModel.setUseBatch(true);
                oModel.attachBatchRequestCompleted(function (dataBatch) {
                    jQuery.sap.log.info("attachBatchRequestCompleted - success");
                    that.getView().byId("idUiTabVendorNoti").setBusy(false);
                    if (iCounter === 1) {
                        that.getOwnerComponent().getModel().refresh();
                        iCounter += 1;
                    }
                    that.oRejectDialog.close();
                    // that.getView().getModel().refresh();
                    sap.ui.core.BusyIndicator.hide();
                });
                oModel.attachBatchRequestFailed(function (e) {
                    jQuery.sap.log.info("attachBatchRequestFailed - fail: " + e);
                    that.getView().byId("idUiTabVendorNoti").setBusy(false);
                    if (iCounter === 1) {
                        that.getOwnerComponent().getModel().refresh();
                        iCounter += 1;
                    }
                    // that.getView().getModel().refresh();
                    sap.ui.core.BusyIndicator.hide();
                });
                for (var a of aData) {
                    var oActionUriParameters = {
                        vendor_Notif_uuid: a.uuid,
                        Vendor_List_manufacturerCode: a.Vendor_List_manufacturerCode,
                        Vendor_List_countryCode_code: a.Vendor_List_countryCode_code,
                        Vendor_List_localManufacturerCode: a.Vendor_List_localManufacturerCode,
                        Comment: sText
                    };
                    oModel.create("/VendorComments", oActionUriParameters, {
                        method: "PUT",
                        success: function (dataRes) {
                            // objectLastRes = dataRes;
                            //jQuery.sap.log.info("create - success");
                        },
                        error: function (e) {
                            jQuery.sap.log.error("create - error");
                            var textMsg = e.statusText;
                            textMsg = textMsg.split("|").join("\n");
                            // that.makeResultDialog("Error", "Error", textMsg).open();
                            isSuccess = false;
                        }
                    });
                }
            }
        });
    }
);
