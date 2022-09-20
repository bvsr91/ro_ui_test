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
        "sap/m/MessageBox",
        "sap/ui/table/RowAction",
        "sap/ui/table/RowActionItem",
        "sap/ui/table/RowSettings",
        "../model/formatter",
        "sap/ui/export/Spreadsheet"
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, MessageBox, RowAction, RowActionItem, RowSettings, formatter, Spreadsheet) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.VendorList", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("vendorList").attachPatternMatched(this._onRouteMatched, this);
                var oMessageManager = sap.ui.getCore().getMessageManager();
                this.getView().setModel(oMessageManager.getMessageModel(), "message");
                this.extendTable();
                var that = this;
                var oHashChanger = new sap.ui.core.routing.HashChanger.getInstance();
                oHashChanger.attachEvent("hashChanged", function (oEvent) {
                    that.routeAuthValidation(oHashChanger.getHash());
                });
                this.routeAuthValidation("vendorList");
                // this.prepareMetadata();
                var oModel = this.getOwnerComponent().getModel();
                oModel.attachMetadataLoaded(null, function () {
                    var oMetadata = oModel.getServiceMetadata();
                    console.log(oMetadata);
                }, null);
            },
            createRecord: function () {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oPayLoad = {};
                // oPayLoad.uuid_manufacturerCode = "55515";
                oPayLoad.uuid = "5";
                // oPayLoad.uuid_countryCode = "AE";
                oPayLoad.comment = "SRini";
                var oModel = this.getOwnerComponent().getModel();
                // this.getView().setBusy(true);
                sap.ui.core.BusyIndicator.show();
                oModel.create("/VendorComments", oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onCloseVendor();
                        // this.getView().setBusy(false);
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record created successfully");
                    }.bind(this),
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        this.getOwnerComponent().getModel().refresh();
                        this.getView().byId("idUiTab").setBusy(false);
                        this.errorHandling(error);
                    }.bind(this)
                });
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
                this.setSelKey("vendorList");
                this.getView().byId("vendSmartTab").rebindTable(true);
            },

            handleAddVendor: function () {
                if (this._DialogAddVendor) {
                    this._DialogAddVendor.destroy(true);
                    this._DialogAddVendor = null;
                }
                if (!this._DialogAddVendor) {
                    this._DialogAddVendor = sap.ui.xmlfragment(this.createId("FrgAddVendorData"), "com.ferrero.zmrouiapp.view.fragments.AddVendorForm", this);
                    this.getView().addDependent(this._DialogAddVendor);
                }
                this._DialogAddVendor.open();
            },
            onCloseVendor: function () {
                if (this._DialogAddVendor) {
                    this._DialogAddVendor.close();
                    this._DialogAddVendor.destroy(true);
                    this._DialogAddVendor = undefined;
                    this.removePrePopulateData();
                }
            },
            onSaveNewVendorData: function (oPayLoad) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                oPayLoad.manufacturerCode = oPayLoad.manufacturerCode === "" ? null : oPayLoad.manufacturerCode;
                oPayLoad.localManufacturerCode = oPayLoad.localManufacturerCode === "" ? null : oPayLoad.localManufacturerCode;
                oPayLoad.countryCode_code = oPayLoad.countryCode_code === "" ? null : oPayLoad.countryCode_code;
                oPayLoad.v_notif = {};
                var oModel = this.getOwnerComponent().getModel();
                // this.getView().setBusy(true);
                sap.ui.core.BusyIndicator.show();
                oModel.create("/VendorList", oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onCloseVendor();
                        // this.getView().setBusy(false);
                        this.getView().byId("OpenDialog").close();
                        this.getOwnerComponent().getModel().refresh();
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record created successfully");
                        this.removePrePopulateData();
                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                        sap.ui.core.BusyIndicator.hide();
                        this.getOwnerComponent().getModel().refresh();
                        this.getView().byId("idUiTab").setBusy(false);
                        this.errorHandling(error);
                    }.bind(this)
                });
            },
            removePrePopulateData: function () {
                this.byId("idIpManf").setValue(""),
                    this.byId("idIpManfDesc").setValue(""),
                    this.byId("idIpLocalManf").setValue(""),
                    this.byId("idIpLocalManfDesc").setValue(""),
                    this.byId("idIpCountry").setValue(""),
                    this.byId("idIpCountryDesc").setText("")
            },
            extendTable: function () {
                var oTable = this.byId("idUiTab");
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
                this.onLinksDownload(oEvent);
            },
            onLinksDownload: function (oEvent) {
                var oInput = oEvent.getSource().getParent();
                var bEdit;
                var bDelete;
                // var oRecordCreator = oInput.getBindingContext().getObject().initiator;
                var oRecordCreator = oInput.getBindingContext().getObject().createdBy;
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if ((logOnUserObj.userid && oRecordCreator.toLowerCase() === logOnUserObj.userid.toLowerCase())
                    && (logOnUserObj.role_role === "CDT" || logOnUserObj.role_role === "SGC")) {
                    bEdit = true;
                    bDelete = true;
                } else {
                    bEdit = false;
                    bDelete = false
                }
                var oActionSheet = new sap.m.ActionSheet({
                    placement: "VerticalPreferredBottom",
                    buttons: [
                        new sap.m.Button({
                            text: 'Edit', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onEditVendorForm.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'Delete', type: 'Transparent', width: '6rem', enabled: bDelete,
                            press: this.onDeleteAwaitConfirm.bind(this, oInput)
                        }),
                        new sap.m.Button({
                            text: 'History', type: 'Transparent', width: '6rem',
                            press: this.onHistoryClick.bind(this, oInput)
                        })
                    ]
                });
                oActionSheet.openBy(oInput);
            },
            onEditVendorForm: function (oInput) {
                this._editObjContext = oInput.getBindingContext();
                this.open_Dialog(this._editObjContext);
            },
            open_Dialog: function (editObj) {
                var oCtx = editObj.getObject();
                var sPath = editObj.getPath();
                if (this._oDialog) {
                    this._oDialog.destroy(true);
                    this._oDialog = null;
                }
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(this.createId("FrgVendorData"), "com.ferrero.zmrouiapp.view.fragments.VendorForm", this);
                    this.getView().addDependent(this._oDialog);
                }
                this.byId(
                    sap.ui.core.Fragment.createId("FrgVendorData", "SimpleFormToolbarDisplay")).bindElement({
                        path: sPath,
                    });
                this._oDialog.open();
            },
            onCloseVendorData: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                    this._oDialog = undefined;
                }
            },
            onSaveVendorData: function (oInput) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var sPath = oInput.getSource().getParent().getParent().getController()._editObjContext.sPath;
                var manufacturerDesc = this.byId(Fragment.createId("FrgVendorData", "ManfDescId")).getValue();
                var localDealerMaufacturerDesc = this.byId(Fragment.createId("FrgVendorData", "localManufDescID")).getValue();
                var localDealerMaufacturer = this.byId(Fragment.createId("FrgVendorData", "idIpLocalManufCode")).getValue();
                var oPayLoad = {};
                oPayLoad.manufacturerCodeDesc = manufacturerDesc;
                oPayLoad.localManufacturerCodeDesc = localDealerMaufacturerDesc;
                oPayLoad.localManufacturerCode = localDealerMaufacturer;
                oPayLoad.status_code = "Pending";
                var oModel = this.getOwnerComponent().getModel();
                // this.getView().setBusy(true);
                sap.ui.core.BusyIndicator.show();
                oModel.update(sPath, oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onCloseVendorData();
                        sap.ui.core.BusyIndicator.hide();
                        this.getOwnerComponent().getModel().refresh();
                        MessageBox.success("Record updated successfully");
                    }.bind(this),
                    error: function (error) {
                        console.log(error);
                        sap.ui.core.BusyIndicator.hide();
                        this.getOwnerComponent().getModel().refresh();
                        this.getView().byId("idUiTab").setBusy(false);
                        this.errorHandling(error);
                    }.bind(this)
                });
            },
            onDeleteAwaitConfirm: function (oInput) {
                this._oDelObjContext = oInput.getBindingContext();
                MessageBox.confirm("Do you want to delete the record?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    initialFocus: MessageBox.Action.CANCEL,
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            this.onConfirmDelete(this._oDelObjContext);
                        }
                    }.bind(this),
                }
                );
            },
            onConfirmDelete: function (oContext) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var oPayLoad = {};
                oPayLoad.status_code = "Deleted";
                sap.ui.core.BusyIndicator.show();
                oModel.update(oContext.sPath, oPayLoad, {
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        this.getOwnerComponent().getModel().refresh();
                        MessageBox.success("Record Deleted successfully");
                    }.bind(this),
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        this.getView().byId("idUiTab").setBusy(false);
                        this.getOwnerComponent().getModel().refresh();
                        this.errorHandling(error);
                    }.bind(this)
                });
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
                aFilter.push(new Filter("Vendor_List_manufacturerCode", FilterOperator.EQ, oSelObj.manufacturerCode, true));
                // aFilter.push(new Filter("localManufacturerCode", FilterOperator.EQ, oSelObj.localManufacturerCode, true));
                aFilter.push(new Filter("Vendor_List_countryCode_code", FilterOperator.EQ, oSelObj.countryCode_code, true));
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
            onValueHelpRequestCountry: function (oEvent) {
                var oDialog = this.openCountryValueHelpDialog(oEvent);
                var sInputValue = this.byId("idIpCountry").getValue();
                if (sInputValue !== "") {
                    var aFilters = [];
                    aFilters.push(new Filter("code", FilterOperator.EQ, sInputValue, true));
                    var oFilter = new Filter({
                        filters: aFilters,
                        and: false,
                    });
                    oDialog.getBinding("items").filter(oFilter);
                    oDialog.open(sInputValue);
                } else {
                    oDialog.open();
                }
            },
            _configValueHelpDialog: function (oEvent) {
                var sInputValue = this.byId("idIpCountry").getValue();
                if (sInputValue !== "") {
                    var aFilters = [];
                    // aFilters.push(this.createFilter("desc", FilterOperator.Contains, sValue, true));
                    aFilters.push(this.createFilter("code", FilterOperator.Contains, sInputValue, true));
                    var oBinding = oEvent.getParameter("itemsBinding");
                    var oFilter = new Filter({
                        filters: aFilters,
                        and: false,
                    });
                    var oBinding = oEvent.getParameter("itemsBinding");
                    oBinding.filter(oFilter);
                }
                // this.byId(sap.ui.core.Fragment.createId("FrgAddVendorData", "idIpCountry")).getValue();
            },

            onValueHelpDialogClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");
                if (!oSelectedItem) {
                    // oInput.resetProperty("value");                    
                    return;
                }
                var desc = oEvent.getParameter("selectedItem").getDescription();
                var code = oEvent.getParameter("selectedItem").getTitle();
                this.byId("idIpCountry").setValue(code);
                this.byId("idIpCountryDesc").setText(desc);
            },
            onSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                // var oFilter = new Filter("desc", FilterOperator.Contains, sValue, true);
                var aFilters = [];
                // aFilters.push(this.createFilter("desc", FilterOperator.Contains, sValue, true));
                // aFilters.push(new Filter("desc", FilterOperator.Contains, sValue, true));
                // aFilters.push(new Filter("code", FilterOperator.Contains, sValue, true));
                aFilters.push(this.createFilter("desc", FilterOperator.Contains, sValue, true));
                aFilters.push(this.createFilter("code", FilterOperator.Contains, sValue, true));
                var oBinding = oEvent.getParameter("itemsBinding");
                var oFilter = new Filter({
                    filters: aFilters,
                    and: false,
                });
                var oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter(oFilter);
            },
            createFilter: function (key, operator, value, useToLower) {
                return new Filter(useToLower ? "tolower(" + key + ")" : key, operator, useToLower ? "'" + value.toLowerCase() + "'" : value);
            },
            onOpenAddDialog: function () {
                // this.getView().byId("OpenDialog").destroy(true);
                this.getView().byId("idIpManf").setValue(null);
                this.getView().byId("idIpManfDesc").setValue(null);
                this.getView().byId("idIpLocalManf").setValue(null);
                this.getView().byId("idIpLocalManfDesc").setValue(null);
                this.getView().byId("idIpCountry").setValue("");
                this.getView().byId("idIpCountryDesc").setText("");
                this.getView().byId("OpenDialog").open();
            },
            onCancelDialog: function (oEvent) {
                oEvent.getSource().getParent().close();
                this.removePrePopulateData();
            },
            onCreate: function () {
                var oList = this.byId("idUiTab");
                var oBinding = oList.getBinding("rows");
                var oPayLoad = {
                    "manufacturerCode": this.byId("idIpManf").getValue(),
                    "manufacturerCodeDesc": this.byId("idIpManfDesc").getValue(),
                    "localManufacturerCode": this.byId("idIpLocalManf").getValue(),
                    "localManufacturerCodeDesc": this.byId("idIpLocalManfDesc").getValue(),
                    "countryCode_code": this.byId("idIpCountry").getValue()
                    // ,
                    // "countryDesc": this.byId("idIpCountryDesc").getText()
                };
                this.onSaveNewVendorData(oPayLoad);
            },
            handleValueChange: function (oEvent) {
                this._import(oEvent.getParameter("files") && oEvent.getParameter("files")[0]);
            },
            _import: function (file, sBindProperty, aActualFields) {
                var json_object = {};
                var that = this;
                if (file && window.FileReader) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var sheetData = [];
                        var data = e.target.result;
                        try {
                            var workbook = XLSX.read(data, {
                                type: 'binary'
                            });
                        } catch (err) {
                            sap.m.MessageToast.show(err);
                        }
                        workbook.SheetNames.forEach(function (sheetName) {
                            // sheetData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);

                            // if (sheetName === "List") {
                            var sheet = workbook.Sheets[sheetName];
                            var roa = XLSX.utils.sheet_to_row_object_array(sheet);

                            sheetData = XLSX.utils.sheet_to_json(sheet);
                            // }
                        });
                        // var aDealerTabData = that.getOwnerComponent().getModel("globalTab").getProperty("/aDealerTab");
                        if (sheetData.length > 0) {
                            that.massCreateData(sheetData);
                            // that.batchCreateData(sheetData);
                        } else {
                            sap.m.MessageBox.error("Please maintain data in the template");
                        }
                    }
                    reader.readAsBinaryString(file);
                }
            },
            massCreateData: function (aData) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var oTable = this.getView().byId("idUiTab");
                sap.ui.core.BusyIndicator.show();
                var that = this,
                    iCounter = 1,
                    oContext = {
                        update: []
                    };
                oModel.setUseBatch(false);
                for (var a = 0; a < aData.length; a++) {
                    aData[a].v_notif = {};
                    if (aData[a].manufacturerCode === "") {
                        aData[a].manufacturerCode = null;
                    }
                    if (aData[a].localManufacturerCode === "") {
                        aData[a].localManufacturerCode = null;
                    }
                    if (aData[a].countryCode_code === "") {
                        aData[a].countryCode_code = null;
                    }
                    oContext.update.push({
                        "entityName": "/VendorList", "payload": aData[a], "iSelIndex": a + 2
                    });
                }
                this.onPromiseAll(oContext.update, 'create', "Created", "VendorList").then((oResponse) => {
                    oTable.setBusy(false);
                    if (iCounter === 1) {
                        that.getOwnerComponent().getModel().refresh();
                        iCounter += 1;
                    }
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.success("Record Created Successfully");
                }).catch((error) => {
                    oTable.setBusy(false);
                    that.getOwnerComponent().getModel().refresh();
                    sap.ui.core.BusyIndicator.hide();
                    var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData(),
                        sMsg;
                    aMessages = aMessages.filter(a => a.type === "Error");
                    if (error.length === aMessages.length) {
                        sMsg = "Mass Upload failed with Error, please click on the Logs button to see the possible cause for the error";
                    } else {
                        sMsg = "Mass Upload partially successfull, please click on the Logs button to see the possible cause for the error";
                    }
                    MessageBox.error(sMsg);
                });
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
            batchCreateData: function (aData) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var that = this;
                var oModel = this.getOwnerComponent().getModel();
                var objectLastRes;
                var isSuccess = true;
                sap.ui.core.BusyIndicator.show();
                oModel.setUseBatch(true);
                oModel.attachBatchRequestCompleted(function (dataBatch) {
                    jQuery.sap.log.info("attachBatchRequestCompleted - success");
                    that.getView().byId("idUiTab").setBusy(false);
                    // that.getView().getModel().refresh();
                    sap.ui.core.BusyIndicator.hide();
                });
                oModel.attachBatchRequestFailed(function (e) {
                    jQuery.sap.log.info("attachBatchRequestFailed - fail: " + e);
                    that.getView().byId("idUiTab").setBusy(false);
                    // that.getView().getModel().refresh();
                    sap.ui.core.BusyIndicator.hide();
                });
                for (var a of aData) {
                    a.v_notif = {};
                    oModel.create("/VendorList", a, {
                        method: "POST",
                        success: function (dataRes) {
                            objectLastRes = dataRes;
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
            exportTemplate: function (tabName) {
                var aFields = ["manufacturerCode", "manufacturerCodeDesc", "localManufacturerCode", "localManufacturerCodeDesc", "countryCode_code"];
                var oModel = this.getOwnerComponent().getModel();
                var aCols = [];
                var oData = {};
                for (var a of aFields) {
                    aCols.push({
                        label: a,
                        property: a,
                        type: 'string'
                    });
                    oData.a = "";
                }
                var aDataSource = [];
                aDataSource.push(oData);
                var oSettings = {
                    workbook: { columns: aCols },
                    dataSource: aDataSource,
                    fileName: "Vendor Template.xlsx"
                };

                var oSheet = new Spreadsheet(oSettings);
                oSheet.build()
                    .then(function () {
                        MessageToast.show('Spreadsheet export has finished');
                    })
                    .finally(function () {
                        oSheet.destroy();
                    });
            }
        });
    }
);
