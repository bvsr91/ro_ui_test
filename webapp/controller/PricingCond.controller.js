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
        "../model/formatter",
        "sap/ui/table/RowAction",
        "sap/ui/table/RowActionItem",
        "sap/ui/table/RowSettings",
        "sap/ui/export/Spreadsheet"
    ],
    function (
        BaseController, JSONModel, Filter, Sorter, FilterOperator, GroupHeaderListItem, Device, Fragment, MessageBox, formatter, RowAction, RowActionItem, RowSettings, Spreadsheet) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.PricingCond", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
             * @public
             */
            onInit: function () {
                this.getRouter().getRoute("pricingCond").attachPatternMatched(this._onRouteMatched, this);
                var oMessageManager = sap.ui.getCore().getMessageManager();
                this.getView().setModel(oMessageManager.getMessageModel(), "message");
                // this.getRouter().attachBypassed(this.onBypassed, this);
                // var oModel = this.getOwnerComponent().getModel("mrosrv_v2")
                // this.getView().setModel(oModel);
                // this.getView().byId("priceSmartTab").rebindTable();
                this.extendTable();
                var that = this;
                var oHashChanger = new sap.ui.core.routing.HashChanger.getInstance();
                oHashChanger.attachEvent("hashChanged", function (oEvent) {
                    that.routeAuthValidation(oHashChanger.getHash());
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
                this.setSelKey("pricingCond");
                this.routeAuthValidation("pricingCond");
            },

            handleAddPricing: function () {
                if (!this._DialogAddPricing) {
                    this._DialogAddPricing = sap.ui.xmlfragment(this.createId("FrgAddPricing"), "com.ferrero.zmrouiapp.view.fragments.AddPricingForm", this);
                    this.getView().addDependent(this._DialogAddPricing);
                }
                this._DialogAddPricing.open();
            },
            onClosePricing: function () {
                if (this._DialogAddPricing) {
                    this._DialogAddPricing.close();
                    this._DialogAddPricing.destroy(true);
                    this._DialogAddPricing = undefined;
                }
            },
            onAddPricingData: function () {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var manufacturerCode = this.byId(Fragment.createId("FrgAddPricing", "idIpManf")).getValue();
                var manufacturerCodeDesc = this.byId(Fragment.createId("FrgAddPricing", "idIpManfDesc")).getValue();
                var country = this.byId(Fragment.createId("FrgAddPricing", "idIpCountry")).getValue();
                var countryDesc = this.byId(Fragment.createId("FrgAddPricing", "idIpCountryDesc")).getText();
                var countryFact = this.byId(Fragment.createId("FrgAddPricing", "idIpContFact")).getValue();
                var validityStartId = this.byId(Fragment.createId("FrgAddPricing", "validityStartId")).getValue();
                var validityEndId = this.byId(Fragment.createId("FrgAddPricing", "validityEndId")).getValue();
                var localCurreny = this.byId(Fragment.createId("FrgAddPricing", "idIpLocCurr")).getValue();
                var exchageRate = this.byId(Fragment.createId("FrgAddPricing", "idIpExchRate")).getValue();
                var bLocalOwnerShipER = this.byId(Fragment.createId("FrgAddPricing", "localOwnershipERId")).getSelected();
                var bLocalOwnerShipCF = this.byId(Fragment.createId("FrgAddPricing", "localOwnershipCFId")).getSelected();
                var oPayLoad = {};
                oPayLoad.manufacturerCode = manufacturerCode === "" ? null : manufacturerCode;
                // oPayLoad.localManufacturerCode = localDealerManufacturerCode;
                oPayLoad.countryCode_code = country === "" ? null : country;
                // oPayLoad.countryDesc = countryDesc;
                oPayLoad.manufacturerCodeDesc = manufacturerCodeDesc;
                oPayLoad.countryFactor = isNaN(parseInt(countryFact)) && countryFact === "" ? null : parseFloat(countryFact);
                oPayLoad.exchangeRate = isNaN(parseInt(exchageRate)) && exchageRate === "" ? null : parseFloat(exchageRate);
                oPayLoad.validityStart = validityStartId === "" ? null : new Date(validityStartId).toISOString();
                oPayLoad.validityEnd = validityEndId === "" ? null : new Date(validityEndId).toISOString();
                oPayLoad.localCurrency_code = localCurreny === "" ? null : localCurreny;
                oPayLoad.lo_exchangeRate = bLocalOwnerShipER;
                oPayLoad.lo_countryFactor = bLocalOwnerShipCF;
                if (bLocalOwnerShipER) {
                    oPayLoad.localCurrency_code = null;
                    oPayLoad.exchangeRate = null;
                }
                if (bLocalOwnerShipCF) {
                    oPayLoad.countryFactor = null;
                }
                oPayLoad.p_notif = {};
                var oModel = this.getOwnerComponent().getModel();
                sap.ui.core.BusyIndicator.show();
                // this.getView().setBusy(true);
                oModel.create("/PricingConditions", oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onClosePricing();
                        // this.getView().setBusy(false);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record created successfully");
                    }.bind(this),
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        this.getView().byId("idPricingCondTab").setBusy(false);
                        this.errorHandling(error);
                    }.bind(this)
                });
            },
            onValueHelpRequestCountry: function (oEvent) {
                this.openCountryValueHelpDialog(oEvent);
            },
            _configValueHelpDialog: function () {
                // var sInputValue = this.byId("idIpCountry").getValue();
                // this.byId(sap.ui.core.Fragment.createId("FrgAddVendorData", "idIpCountry")).getValue();
            },

            onValueHelpDialogClose: function (oEvent) {
                this.countryValueHelpClose(oEvent, "FrgAddPricing", "idIpCountry", "idIpCountryDesc")
            },
            onSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                // var oFilter = new Filter("desc", FilterOperator.Contains, sValue, true);
                var aFilters = [];
                aFilters.push(this.createFilter("desc", FilterOperator.Contains, sValue, true));

                var oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter(aFilters);
            },
            createFilter: function (key, operator, value, useToLower) {
                return new Filter(useToLower ? "tolower(" + key + ")" : key, operator, useToLower ? "'" + value.toLowerCase() + "'" : value);
            },

            extendTable: function () {
                var oTable = this.byId("idPricingCondTab");
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
                var bEdit, bDelete;
                var oRecordCreator;
                var oSelObj = oInput.getBindingContext().getObject();
                var logOnUserObj = this.getOwnerComponent().getModel("userModel").getProperty("/role");
                if (logOnUserObj.role_role === "LDT") {
                    oRecordCreator = oInput.getBindingContext().getObject().ld_initiator;
                    if (logOnUserObj.userid && (oRecordCreator !== null && oRecordCreator.toLowerCase() === logOnUserObj.userid.toLowerCase()) &&
                        oSelObj.status_code === "In Progress") {
                        bEdit = true;
                        bDelete = true;
                    } else {
                        bEdit = false;
                        bDelete = false;
                    }
                } else {
                    oRecordCreator = oInput.getBindingContext().getObject().initiator;
                    if (logOnUserObj.userid && (oRecordCreator !== null && oRecordCreator.toLowerCase() === logOnUserObj.userid.toLowerCase())
                        && oSelObj.status_code === "Pending" && (logOnUserObj.role_role === "CDT" || logOnUserObj.role_role === "LDT")) {
                        bEdit = true;
                        bDelete = true;
                    } else {
                        bEdit = false;
                        bDelete = false;
                    }
                }
                var oActionSheet = new sap.m.ActionSheet({
                    placement: "VerticalPreferredBottom",
                    buttons: [
                        new sap.m.Button({
                            text: 'Edit', type: 'Transparent', width: '6rem', enabled: bEdit,
                            press: this.onEditPricingForm.bind(this, oInput)
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

            onEditPricingForm: function (oInput) {
                this._editObjContext = oInput.getBindingContext();
                this.open_Dialog(this._editObjContext);
            },

            open_Dialog: function (editObj) {
                var oCtx = editObj.getObject();
                var sPath = editObj.getPath();
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(this.createId("FrgPricingData"), "com.ferrero.zmrouiapp.view.fragments.PricingConditionForm", this);
                    this.getView().addDependent(this._oDialog);
                }
                this.byId(sap.ui.core.Fragment.createId("FrgPricingData", "SimpleFormToolbarPricingDisplay"))
                    .bindElement({
                        path: sPath,
                    });
                this._oDialog.open();
            },
            onSavePricingData: function (oInput) {
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oModel = this.getOwnerComponent().getModel();
                var sPath = oInput.getSource().getParent().getParent().getController()._editObjContext.sPath;
                var manufacturerDesc = this.byId(Fragment.createId("FrgPricingData", "idIpManfDesc")).getValue().trim();
                var exchangeRate = this.byId(Fragment.createId("FrgPricingData", "idExchRate")).getValue();
                var countryFactor = this.byId(Fragment.createId("FrgPricingData", "idContFactor")).getValue();
                var validityStartId = this.byId(Fragment.createId("FrgPricingData", "validityStartId")).getValue();
                var validityEndId = this.byId(Fragment.createId("FrgPricingData", "validityEndId")).getValue();
                var bLocalOwnerShipER = this.byId(Fragment.createId("FrgPricingData", "localOwnershipERId")).getSelected();
                var bLocalOwnerShipCF = this.byId(Fragment.createId("FrgPricingData", "localOwnershipCFId")).getSelected();
                var localCurreny = this.byId(Fragment.createId("FrgPricingData", "idIpLocCurr")).getValue();
                var oPayLoad = {};
                var oObj = oInput.getSource().getParent().getParent().getController()._editObjContext.getObject();
                oPayLoad.manufacturerCodeDesc = manufacturerDesc.trim();
                oPayLoad.ld_initiator = oObj.ld_initiator;
                oPayLoad.countryCode_code = oObj.countryCode_code;
                oPayLoad.p_notif_uuid = oObj.p_notif_uuid;
                // oPayLoad.status_code = "Pending";
                oPayLoad.countryFactor = isNaN(parseInt(countryFactor)) && countryFactor === "" ? null : parseFloat(countryFactor);
                oPayLoad.exchangeRate = isNaN(parseInt(exchangeRate)) && exchangeRate === "" ? null : parseFloat(exchangeRate);
                oPayLoad.validityStart = validityStartId === "" ? null : new Date(validityStartId).toISOString();
                oPayLoad.validityEnd = validityEndId === "" ? null : new Date(validityEndId).toISOString();
                oPayLoad.lo_exchangeRate = bLocalOwnerShipER;
                oPayLoad.lo_countryFactor = bLocalOwnerShipCF;
                oPayLoad.localCurrency_code = localCurreny === "" ? null : localCurreny;
                if (bLocalOwnerShipER) {
                    oPayLoad.localCurrency_code = localCurreny.trim() === "" ? null : localCurreny;
                    oPayLoad.exchangeRate = isNaN(parseInt(exchangeRate)) && exchangeRate === "" ? null : parseFloat(exchangeRate);
                }
                if (bLocalOwnerShipCF) {
                    oPayLoad.countryFactor = isNaN(parseInt(countryFactor)) && countryFactor === "" ? null : parseFloat(countryFactor);
                }
                var oModel = this.getOwnerComponent().getModel();
                // this.getView().setBusy(true);
                sap.ui.core.BusyIndicator.show();
                oModel.update(sPath, oPayLoad, {
                    success: function (oData) {
                        console.log(oData);
                        this.onClosePricingData();
                        // this.getView().setBusy(false);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record updated successfully");
                    }.bind(this),
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        this.errorHandling(error);
                        this.getView().byId("idPricingCondTab").setBusy(false);
                    }.bind(this)
                });
            },
            onClosePricingData: function () {
                if (this._oDialog) {
                    this._oDialog.close();
                    this._oDialog.destroy();
                    this._oDialog = undefined;
                }
            },
            onDeleteAwaitConfirm: function (oInput) {
                this._oDelObjContext = oInput.getBindingContext();
                MessageBox.confirm("Do you want to delete the record?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
                    initialFocus: MessageBox.Action.CANCEL,
                    onClose: function (sAction) {
                        if (sAction === "YES") {
                            this.onConfirmDelete(oInput);
                        }
                    }.bind(this),
                }
                );
            },
            onConfirmDelete: function (oInput) {
                var oModel = this.getOwnerComponent().getModel();
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var oPayLoad = {};
                oPayLoad.status_code = "Deleted";
                oPayLoad.p_notif_uuid = oInput.getBindingContext().getProperty("p_notif_uuid");
                sap.ui.core.BusyIndicator.show();
                oModel.update(oInput.getBindingContext().getPath(), oPayLoad, {
                    success: function (oData) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("Record Deleted successfully");
                    }.bind(this),
                    error: function (error) {
                        sap.ui.core.BusyIndicator.hide();
                        this.getView().byId("idPricingCondTab").setBusy(false);
                        this.errorHandling(error);
                    }.bind(this)
                });
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
            onSelectLocalOwnershipER: function (oEvent) {
                var bSel = oEvent.getParameter("selected");
                if (bSel) {
                    this.byId(Fragment.createId("FrgAddPricing", "idIpLocCurr")).setEnabled(!bSel);
                    this.byId(Fragment.createId("FrgAddPricing", "idIpExchRate")).setEnabled(!bSel);
                    this.byId(Fragment.createId("FrgAddPricing", "idIpLocCurr")).setValue("");
                    this.byId(Fragment.createId("FrgAddPricing", "idIpExchRate")).setValue(null);
                } else {
                    this.byId(Fragment.createId("FrgAddPricing", "idIpLocCurr")).setEnabled(!bSel);
                    this.byId(Fragment.createId("FrgAddPricing", "idIpExchRate")).setEnabled(!bSel);
                }
            },
            onSelectLocalOwnershipCF: function (oEvent) {
                var bSel = oEvent.getParameter("selected");
                if (bSel) {
                    this.byId(Fragment.createId("FrgAddPricing", "idIpContFact")).setEnabled(!bSel);
                    this.byId(Fragment.createId("FrgAddPricing", "idIpContFact")).setValue(null);

                } else {
                    this.byId(Fragment.createId("FrgAddPricing", "idIpContFact")).setEnabled(!bSel);
                }
            },
            onSelectLocalOwnershipEditER: function (oEvent) {
                var bSel = oEvent.getParameter("selected");
                if (bSel) {
                    this.byId(Fragment.createId("FrgPricingData", "idIpLocCurr")).setEnabled(!bSel);
                    this.byId(Fragment.createId("FrgPricingData", "idExchRate")).setEnabled(!bSel);
                    // this.byId(Fragment.createId("FrgPricingData", "idIpLocCurr")).setValue("");
                    // this.byId(Fragment.createId("FrgPricingData", "idExchRate")).setValue(null);
                } else {
                    this.byId(Fragment.createId("FrgPricingData", "idIpLocCurr")).setEnabled(!bSel);
                    this.byId(Fragment.createId("FrgPricingData", "idExchRate")).setEnabled(!bSel);
                }
            },
            onSelectLocalOwnershipEditCF: function (oEvent) {
                var bSel = oEvent.getParameter("selected");
                if (bSel) {
                    this.byId(Fragment.createId("FrgPricingData", "idContFactor")).setEnabled(!bSel);
                    // this.byId(Fragment.createId("FrgPricingData", "idContFactor")).setValue(null);

                } else {
                    this.byId(Fragment.createId("FrgAddPricing", "idContFactor")).setEnabled(!bSel);
                }
            },
            onValueHelpRequestCurrency: function (oEvent) {
                var oView = this.getView();
                if (!this._currencyVHDialog) {
                    this._currencyVHDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.ferrero.zmrouiapp.view.fragments.CurrencyVH",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }
                this._currencyVHDialog.then(function (oValueHelpDialog) {
                    this._configValueHelpDialog();
                    oValueHelpDialog.open();
                }.bind(this));
            },
            _configValueHelpDialog: function () {
                // var sInputValue = this.byId("idIpCountry").getValue();
                // this.byId(sap.ui.core.Fragment.createId("FrgAddVendorData", "idIpCountry")).getValue();
            },

            onValueHelpDialogCurrencyClose: function (oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem"),
                    oInput = this.byId(sap.ui.core.Fragment.createId("FrgAddPricing", "idIpLocCurr")) ? this.byId(sap.ui.core.Fragment.createId("FrgAddPricing", "idIpLocCurr")) : this.byId(sap.ui.core.Fragment.createId("FrgPricingData", "idIpLocCurr"));
                if (!oSelectedItem) {
                    oInput.resetProperty("value");
                    // this.byId(sap.ui.core.Fragment.createId("FrgAddPricing", sTextID)).setText("");
                    return;
                }
                oInput.setValue(oSelectedItem.getTitle());
                // this.byId(sap.ui.core.Fragment.createId("FrgAddPricing", sTextID)).setText(oSelectedItem.getDescription());
            },
            onSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                // var oFilter = new Filter("desc", FilterOperator.Contains, sValue, true);
                var aFilters = [];
                aFilters.push(this.createFilter("desc", FilterOperator.Contains, sValue, true));

                var oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter(aFilters);
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
                            var sheet = workbook.Sheets[sheetName];
                            var roa = XLSX.utils.sheet_to_row_object_array(sheet);

                            sheetData = XLSX.utils.sheet_to_json(sheet);
                            // }
                        });
                        if (sheetData.length > 0) {
                            that.massCreateData(sheetData);
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
                var oTable = this.getView().byId("idPricingCondTab");
                sap.ui.core.BusyIndicator.show();
                var that = this,
                    iCounter = 1,
                    oContext = {
                        update: []
                    };
                oModel.setUseBatch(false);
                for (var a = 0; a < aData.length; a++) {
                    aData[a].p_notif = {};
                    if (aData[a].manufacturerCode === "") {
                        aData[a].manufacturerCode = null;
                    }
                    if (aData[a].countryCode_code === "") {
                        aData[a].countryCode_code = null;
                    }
                    if (aData[a].countryFactor) {
                        aData[a].countryFactor = isNaN(parseInt(aData[a].countryFactor)) && aData[a].countryFactor === "" ? null : parseFloat(aData[a].countryFactor);
                    }
                    if (aData[a].exchangeRate) {
                        aData[a].exchangeRate = isNaN(parseInt(aData[a].exchangeRate)) && aData[a].exchangeRate === "" ? null : parseFloat(aData[a].exchangeRate);
                    }
                    if (aData[a].validityStart) {
                        if (aData[a].validityStart !== "") {
                            // var newData = a.validityStart.replace(/(\d+[/])(\d+[/])/, '$2$1');
                            var date1 = a.validityStart.split("/");
                            var d = new Date(date1[2], date1[1] - 1, (parseInt(date1[0]) + 1).toString());
                            aData[a].validityStart = d.toISOString();
                        }
                        else {
                            aData[a].validityStart = null;
                        }
                    }
                    if (aData[a].validityEnd) {
                        if (aData[a].validityEnd !== "") {
                            var date1 = a.validityEnd.split("/");
                            var d = new Date(date1[2], date1[1] - 1, (parseInt(date1[0]) + 1).toString());
                            aData[a].validityEnd = d.toISOString();
                        } else {
                            aData[a].validityEnd = null;
                        }
                    }
                    if (aData[a].lo_exchangeRate === "X" || aData[a].lo_exchangeRate === "x") {
                        aData[a].lo_exchangeRate = true;
                        aData[a].exchangeRate = null;
                        aData[a].localCurrency_code = null;
                    }
                    if (aData[a].lo_countryFactor === "X" || aData[a].lo_countryFactor === "x") {
                        aData[a].lo_countryFactor = true;
                        aData[a].countryFactor = null;
                    }
                    oContext.update.push({
                        "entityName": "/PricingConditions", "payload": aData[a], "iSelIndex": a + 2
                    });                
                }
                this.onPromiseAll(oContext.update, 'create', "Created", "PricingConditions").then((oResponse) => {
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
            exportTemplate: function () {
                var aFields = ["manufacturerCode", "manufacturerCodeDesc", "countryCode_code",
                    "lo_exchangeRate", "exchangeRate", "localCurrency_code", "lo_countryFactor", "countryFactor", "validityStart", "validityEnd"];
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
                    fileName: "Pricing Template.xlsx"
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
