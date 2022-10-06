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
        Device, Fragment, formatter, RowAction, RowActionItem, RowSettings, MessageBox,
        Dialog, Button, Label, mobileLibrary, MessageToast, Text, TextArea) {

        "use strict";

        // shortcut for sap.m.ButtonType
        var ButtonType = mobileLibrary.ButtonType;
        // shortcut for sap.m.DialogType
        var DialogType = mobileLibrary.DialogType;

        return BaseController.extend("com.ferrero.zmrouiapp.controller.PricingNotifications", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("pricingNoti").attachPatternMatched(this._onRouteMatched, this);
                var oMessageManager = sap.ui.getCore().getMessageManager();
                this.getView().setModel(oMessageManager.getMessageModel(), "message");
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
                sap.ui.getCore().getMessageManager().removeAllMessages();
                this.setSelKey("pricingNoti");
                this.getView().byId("idSTabPrcingNoti").rebindTable(true);
            },
            onMessagePopoverPress: function (oEvent) {
                var oSourceControl = oEvent.getSource();
                this._getMessagePopover().then(function (oMessagePopover) {
                    oMessagePopover.openBy(oSourceControl);
                });
            },

            _getMessagePopover: function () {
                var oView = this.getView();

                // create popover lazily (singleton)
                if (!this._pMessagePopover) {
                    this._pMessagePopover = Fragment.load({
                        id: oView.getId(),
                        name: "com.ferrero.zmrouiapp.view.fragments.MessagePopover"
                    }).then(function (oMessagePopover) {
                        oView.addDependent(oMessagePopover);
                        return oMessagePopover;
                    });
                }
                return this._pMessagePopover;
            },
            onBeforeRebindTable: async function (oEvent) {
                var mBindingParams = oEvent.getParameter("bindingParams"),
                    // oSmtFilter = this.getView().byId("idSTabPrcingNoti"),
                    oModel = this.getOwnerComponent().getModel(),
                    sTabSelKey = this.getView().byId("idIconTabBar").getSelectedKey();
                var oUserModel = this.getOwnerComponent().getModel("userModel");
                var role = oUserModel.getData().role;
                this._sEntitySet;
                var sFieldName;
                if (!role) {
                    await this.validateUser();
                }
                if (role.role_role) {
                    if (role.role_role === "CDT") {
                        this.getView().byId("idSTabPrcingNoti").setEntitySet("PricingNoti_CU");
                        this._sEntitySet = "PricingNoti_CU";
                    }
                    else if (role.role_role === "LDT") {
                        this.getView().byId("idSTabPrcingNoti").setEntitySet("PricingNoti_LU");
                        this._sEntitySet = "PricingNoti_LU";
                    }
                    else if (role.role_role === "GCM") {
                        this.getView().byId("idSTabPrcingNoti").setEntitySet("PricingNoti_CA");
                        this._sEntitySet = "PricingNoti_CA";
                    }
                    else if (role.role_role === "LP") {
                        this.getView().byId("idSTabPrcingNoti").setEntitySet("PricingNoti_LA");
                        this._sEntitySet = "PricingNoti_LA";
                    }
                    else if (role.role_role === "SGC") {
                        this.getView().byId("idSTabPrcingNoti").setEntitySet("PricingNoti_CS");
                        this._sEntitySet = "PricingNoti_CS";
                    }
                    else {
                        this.getView().byId("idSTabPrcingNoti").setEntitySet("PricingNoti_LS");
                        this._sEntitySet = "PricingNoti_LS";
                    }
                }
                if (sTabSelKey !== "All" && sTabSelKey !== "") {
                    if (role.role_role === "CDT") {
                        var aFilter = [];
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "In Progress"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Forwarded"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Deleted"));
                        aFilter.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
                        var oFilter = new Filter({
                            filters: aFilter,
                            and: true,
                        });
                        mBindingParams.filters.push(oFilter);
                    }
                    else if (role.role_role === "LDT") {
                        var aFilter = [];
                        if (sTabSelKey === "Forwarded") {
                            aFilter.push(new Filter("status_code", FilterOperator.EQ, "Forwarded"));
                            var oFilter = new Filter({
                                filters: aFilter,
                                and: true,
                            });
                        } else {
                            aFilter.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
                            aFilter.push(new Filter("status_code", FilterOperator.NE, "Deleted"));
                            // aFilter.push(new Filter("user", FilterOperator.EQ, role.userid));
                            var oFilter = new Filter({
                                filters: aFilter,
                                and: true,
                            });
                        }
                        mBindingParams.filters.push(oFilter);
                    } else if (role.role_role === "SGC") {
                        var aFilter = [];
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "In Progress"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Forwarded"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Deleted"));
                        aFilter.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey));
                        var oFilter = new Filter({
                            filters: aFilter,
                            and: true,
                        });
                        mBindingParams.filters.push(oFilter);
                    }
                    else {
                        mBindingParams.filters.push(new Filter("status_code", FilterOperator.EQ, sTabSelKey))
                    }
                } else {
                    if (role.role_role === "CDT") {
                        var aFilter = [];
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "In Progress"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Forwarded"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Deleted"));
                        var oFilter = new Filter({
                            filters: aFilter,
                            and: true,
                        });
                        mBindingParams.filters.push(oFilter);
                    } else if (role.role_role === "LDT") {
                        var aFilter = [];
                        // aFilter.push(new Filter("user", FilterOperator.EQ, role.userid));
                        aFilter.push(new Filter("status_code", FilterOperator.EQ, "Forwarded"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Deleted"));
                        var oFilter = new Filter({
                            filters: aFilter,
                            and: false,
                        });
                        mBindingParams.filters.push(oFilter);
                    } else if (role.role_role === "SGC") {
                        var aFilter = [];
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "In Progress"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Forwarded"));
                        aFilter.push(new Filter("status_code", FilterOperator.NE, "Deleted"));
                        var oFilter = new Filter({
                            filters: aFilter,
                            and: true,
                        });
                        mBindingParams.filters.push(oFilter);
                    }
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
                this.getView().byId("idSTabPrcingNoti").rebindTable(true);
            },
            extendTable: function () {
                var oTable = this.byId("idUiTabPricingNoti");
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
                var bEdit = false, bDelete = false, bAccept = false, bReopen = false;
                var oSelObj = oInput.getBindingContext().getObject(),
                    oRecordApprover;
                if (oSelObj.ld_initiator && oSelObj.ld_initiator !== "") {
                    oRecordApprover = oSelObj.localApprover;
                } else {
                    oRecordApprover = oSelObj.approver;
                }
                var oObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (oObj.userid && (oRecordApprover && oRecordApprover.toUpperCase() === oObj.userid.toUpperCase()) && (oObj.role_role === "GCM" ||
                    oObj.role_role === "LP" || oObj.role_role === "SGC" || oObj.role_role === "SLP")) {
                    if (oSelObj.status_code !== "Pending") {
                        bEdit = false;
                    } else {
                        bEdit = true;
                    }
                } else {
                    bEdit = false;
                }
                if (oSelObj.status_code === "Forwarded") {
                    bAccept = true;
                } else {
                    bAccept = false;
                }
                if (oSelObj.status_code === "Approved") {
                    if ((oObj.role_role === "GCM" || oObj.role_role === "SGC") && !oSelObj.local_completionDate &&
                        oObj.userid.toUpperCase() === oSelObj.approver.toUpperCase()) {
                        bReopen = true;
                    }
                    if ((oObj.role_role === "LP" || oObj.role_role === "SLP") && oSelObj.local_completionDate &&
                        (oObj.userid.toUpperCase() === oSelObj.localApprover.toUpperCase() && oSelObj.localApprover)) {
                        bReopen = true;
                    }
                }
                var oActionSheet = new sap.m.ActionSheet({
                    placement: "VerticalPreferredBottom",
                    buttons: [
                        new sap.m.Button({
                            text: 'Accept', type: 'Transparent', width: '6rem', visible: bAccept,
                            press: this.onPressAccept.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Approve', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressApprove.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Reject', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onPressReject.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Re-Open', type: 'Transparent', width: '6rem', visible: bReopen,
                            press: this.onPressReopen.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'History', type: 'Transparent', width: '6rem',
                            press: this.onHistoryClick.bind(this, oInput)
                        })
                    ]
                });
                oActionSheet.openBy(oInput);
            },
            onPressApprove: async function (oInput) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");

                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    uuid: oSelObj.uuid,
                    manufacturerCode: oSelObj.manufacturerCode,
                    countryCode: oSelObj.countryCode_code
                };
                var sPath = "/approvePricing";
                sap.ui.core.BusyIndicator.show();
                const info = await this.updatePricingRecord(oModel, sPath, oActionUriParameters);
                if (info.approvePricing) {
                    MessageBox.success("Record Approved Successfully");
                } else {
                    this.errorHandling(info);
                }
                sap.ui.core.BusyIndicator.hide();
            },
            updatePricingRecord: function (oModel, sPath, oPayLoad) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                return new Promise(function (resolve, reject) {
                    oModel.callFunction(sPath, {
                        method: "POST",
                        urlParameters: oPayLoad,
                        success: function (oData) {
                            this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                            this.getOwnerComponent().getModel().refresh();
                            // this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            this.getOwnerComponent().getModel().refresh();
                            resolve(error);
                        }.bind(this)
                    });
                }.bind(this));
            },
            onHistoryClick: function (oInput) {
                var sPath = oInput.getBindingContext().getPath;
                var oSelObj = oInput.getBindingContext().getObject();
                var oModel = this.getOwnerComponent().getModel();
                // const info = await $.get(oModel.sServiceUrl + '/VendorComments?');
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(this.createId("FrgPricingComments"), "com.ferrero.zmrouiapp.view.fragments.PricingHistory", this);
                    this.getView().addDependent(this._oDialog);
                }
                var oList = this.byId(Fragment.createId("FrgPricingComments", "idListPricingComment"));
                var aFilter = [];
                aFilter.push(new Filter("Pricing_Conditions_manufacturerCode", FilterOperator.EQ, oSelObj.manufacturerCode, true));
                aFilter.push(new Filter("Pricing_Conditions_countryCode_code", FilterOperator.EQ, oSelObj.countryCode_code, true));
                aFilter.push(new Filter("Pricing_Conditions_uuid", FilterOperator.EQ, oSelObj.uuid, true));
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
            onPressAccept: function (oEvent) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var oObj = oEvent.getBindingContext().getObject();
                var oPayLoad = {
                    uuid: oObj.uuid,
                    manufacturerCode: oObj.manufacturerCode,
                    countryCode_code: oObj.countryCode_code
                };
                sap.ui.core.BusyIndicator.show();

                oModel.callFunction("/acceptPricingCond", {
                    method: "POST",
                    urlParameters: oPayLoad,
                    success: function (oData) {
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record Accepted Successfully,You can work on the Request!!");
                    }.bind(this),
                    error: function (error) {
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                        this.errorHandling(error);
                    }.bind(this)
                });
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
                                text: "Do you want to reject " + oSelObj.manufacturerCode + "?",
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
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var sText = sap.ui.getCore().byId("rejectionNote").getValue();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var oSelObj = oInput.getBindingContext().getObject();
                var oActionUriParameters = {
                    // pricing_Notif_uuid: oSelObj.uuid,
                    Pricing_Conditions_manufacturerCode: oSelObj.manufacturerCode,
                    Pricing_Conditions_countryCode_code: oSelObj.countryCode_code,
                    Pricing_Conditions_uuid: oSelObj.uuid,
                    Comment: sText
                };
                var oPayLoadVL = {
                    status_code: "Rejected"
                };
                sap.ui.core.BusyIndicator.show();
                const info = await this.createPricingComment(oModel, "/PricingComments", oActionUriParameters);
                if (info.uuid) {
                    MessageBox.success("Record Rejected Successfully");
                } else {
                    this.errorHandling(info);
                }
                sap.ui.core.BusyIndicator.hide();
                this.oRejectDialog.close();
            },
            updatePricingRecordData: function (oModel, sPath, oPayLoad) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                return new Promise(function (resolve, reject) {
                    oModel.update(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                            // this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            this.getOwnerComponent().getModel().refresh();
                            resolve(error);
                        }.bind(this)
                    });
                }.bind(this));
            },
            createPricingComment: function (oModel, sPath, oPayLoad) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                return new Promise(function (resolve, reject) {
                    oModel.create(sPath, oPayLoad, {
                        success: function (oData) {
                            this.getView().byId("idSTabPrcingNoti").rebindTable(true);
                            this.getOwnerComponent().getModel().refresh();
                            // this._oPopover.close();
                            resolve(oData);
                        }.bind(this),
                        error: function (error) {
                            this.getOwnerComponent().getModel().refresh();
                            resolve(error);
                        }.bind(this)
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
                var oTable = this.getView().byId("idUiTabPricingNoti"),
                    aSelectedIndices = oTable.getSelectedIndices(),
                    aRows = oTable.getRows(),
                    aPayLoad = [];
                if (aSelectedIndices.length > 0) {
                    for (var a of aSelectedIndices) {
                        aPayLoad.push(oTable.getContextByIndex(a).getObject());
                    }
                    this.batchUpdateRecords(aPayLoad, oTable);
                } else {
                    MessageBox.warning("Please select atleast one Row");
                    return;
                }
            },
            batchUpdateRecords: function (aData, oTable) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                sap.ui.core.BusyIndicator.show();
                var that = this,
                    iCounter = 1,
                    oContext = {
                        update: []
                    };
                oModel.setUseBatch(false);
                var selectedValues = oTable.getSelectedIndices();
                for (var a = 0; a < aData.length; a++) {
                    var oActionUriParameters = {
                        uuid: aData[a].uuid,
                        manufacturerCode: aData[a].manufacturerCode,
                        countryCode: aData[a].countryCode_code,
                    };
                    // if (logOnUserObj.role_role === "GCM" || logOnUserObj.role_role === "SGC") {
                    //     oActionUriParameters.completionDate = new Date().toISOString();
                    // } else if (logOnUserObj.role_role === "LP" || logOnUserObj.role_role === "SLP") {
                    //     oActionUriParameters.local_completionDate = new Date().toISOString();
                    // }

                    oContext.update.push({
                        "entityName": "/approvePricing", "payload": oActionUriParameters, "iSelIndex": selectedValues[a] + 1
                    });
                }
                this.onPromiseAll(oContext.update, 'callFunction', "Approved", "PricingNotifications").then((oResponse) => {
                    oTable.setBusy(false);
                    if (iCounter === 1) {
                        that.getOwnerComponent().getModel().refresh();
                        iCounter += 1;
                    }
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.success("Record(s) Approved Successfully");
                    oTable.clearSelection();


                }).catch((error) => {
                    oTable.setBusy(false);
                    that.getOwnerComponent().getModel().refresh();
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error While Approving All/Partial Requests");
                    oTable.clearSelection();
                });
            },
            handleReject: function () {
                // var oSelObj = oInput.getBindingContext().getObject();
                var oTable = this.getView().byId("idUiTabPricingNoti"),
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
                            press: this.onBatchRejOk.bind(this, aPayLoad, oTable),
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
            onBatchRejOk: function (aData, oTable) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var sText = sap.ui.getCore().byId("rejectionNote").getValue();
                var oModel = this.getOwnerComponent().getModel();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                var that = this,
                    iCounter = 1;
                var oContext = {
                    update: []
                };
                sap.ui.core.BusyIndicator.show();
                oModel.setUseBatch(false);
                var selectedValues = oTable.getSelectedIndices();
                for (var a = 0; a < aData.length; a++) {
                    var oActionUriParameters = {
                        Pricing_Conditions_manufacturerCode: aData[a].manufacturerCode,
                        Pricing_Conditions_countryCode_code: aData[a].countryCode_code,
                        Pricing_Conditions_uuid: aData[a].uuid,
                        Comment: sText
                    };
                    oContext.update.push({
                        "entityName": "/PricingComments", "payload": oActionUriParameters, "iSelIndex": selectedValues[a] + 1
                    });
                }
                this.onPromiseAll(oContext.update, 'create', "Reject", "PricingComments").then((oResponse) => {
                    oTable.setBusy(false);
                    if (iCounter === 1) {
                        that.getOwnerComponent().getModel().refresh();
                        iCounter += 1;
                    }
                    that.oRejectDialog.close();
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.success("Record(s) Rejected Successfully");
                    oTable.clearSelection();


                }).catch((error) => {
                    oTable.setBusy(false);
                    that.getOwnerComponent().getModel().refresh();
                    that.oRejectDialog.close();
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Error While Rejecting All/Partial Requests");
                    oTable.clearSelection();

                })
            },
            onPressReopen: function (oInput) {
                var sPath = oInput.getBindingContext().getPath;
                var oSelObj = oInput.getBindingContext().getObject();
                var oModel = this.getOwnerComponent().getModel();
                if (this._oReopenDialog) {
                    this._oReopenDialog.destroy(true);
                    this._oReopenDialog = null;
                }
                if (!this._oReopenDialog) {
                    this._oReopenDialog = sap.ui.xmlfragment(this.createId("FrgReopenPricing"), "com.ferrero.zmrouiapp.view.fragments.Reopen", this);
                    this.getView().addDependent(this._oReopenDialog);
                }
                // var oList = this.byId(Fragment.createId("FrgVendorComments", "idTxtReopen"));
                this.byId(Fragment.createId("FrgReopenPricing", "idTxtReopen")).setText(oSelObj.uuid);
                this._oReopenDialog.open();
            },
            onPressReopenSave: function (oEvent) {
                var iSelIndex = this.byId(Fragment.createId("FrgReopenPricing", "idRgb")).getSelectedIndex(),
                    uuid = this.byId(Fragment.createId("FrgReopenPricing", "idTxtReopen")).getText(),
                    sComment = this.byId(Fragment.createId("FrgReopenPricing", "idTxtAreaComment")).getValue();
                sap.ui.getCore().getMessageManager().removeAllMessages();
                if (sComment.trim() === "") {
                    MessageBox.error("Please enter Comment");
                    return;
                }
                var oModel = this.getOwnerComponent().getModel();
                var oPayLoad = {
                    uuid: uuid,
                    status: iSelIndex === 0 ? "Pending" : "Deleted",
                    comment: sComment
                };
                sap.ui.core.BusyIndicator.show();

                oModel.callFunction("/reopenPricing", {
                    method: "POST",
                    urlParameters: oPayLoad,
                    success: function (oData) {
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                        this.onPressCanelReopen();
                        MessageBox.success("Record Updated Successfully");
                    }.bind(this),
                    error: function (error) {
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                        this.errorHandling(error);
                    }.bind(this)
                });
            },
            onPressCanelReopen: function (oEvent) {
                if (this._oReopenDialog) {
                    this._oReopenDialog.destroy(true);
                    this._oReopenDialog = null;
                }
            }
        });
    }
);
