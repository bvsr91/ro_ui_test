sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/core/routing/History",
        "sap/ui/core/Fragment"],
    function (Controller, History, Fragment) {
        "use strict";

        return Controller.extend("com.ferrero.zmrouiapp.controller.BaseController", {
            /**
             * Convenience method for accessing the router in every controller of the application.
             * @public
             * @returns {sap.ui.core.routing.Router} the router for this component
             */
            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            /**
             * Convenience method for getting the view model by name in every controller of the application.
             * @public
             * @param {string} sName the model name
             * @returns {sap.ui.model.Model} the model instance
             */
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            /**
             * Convenience method for setting the view model in every controller of the application.
             * @public
             * @param {sap.ui.model.Model} oModel the model instance
             * @param {string} sName the model name
             * @returns {sap.ui.mvc.View} the view instance
             */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            /**
             * Convenience method for getting the resource bundle.
             * @public
             * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
             */
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

            /**
             * Event handler for navigating back.
             * It there is a history entry we go one step back in the browser history
             * If not, it will replace the current entry of the browser history with the master route.
             * @public
             */
            onNavBack: function () {
                var sPreviousHash = History.getInstance().getPreviousHash();

                if (sPreviousHash !== undefined) {
                    // eslint-disable-next-line sap-no-history-manipulation
                    history.go(-1);
                } else {
                    this.getRouter().navTo("master", {}, true);
                }
            },
            toolPageExpanded: function (bVal) {
                this.getOwnerComponent().getModel("userModel").setProperty("/isExpanded", bVal);
            },
            determineVisibilityBasedOnRole: function () {
                var oVisibleModel = this.getOwnerComponent().getModel("userModel");
                var oVisibleData = oVisibleModel.getData();
                var bCudVisible = false,
                    sRoleName;
                if (oVisibleData.role === "GCM") {
                    // Global catalog manager
                    bCudVisible = false;
                    sRoleName = "Global Catalog Manager";
                } else if (oVisibleData.role === "CDT") {
                    //Central Delivery Team
                    bCudVisible = true;
                    sRoleName = "Central Delivery Team";
                } else if (oVisibleData.role === "LPT") {
                    //Local Procurement Team
                    bCudVisible = false;
                    sRoleName = "Local Procurement Team";
                } else if (oVisibleData.role === "LDT") {
                    // Local Delivery Team
                    bCudVisible = true;
                    sRoleName = "Local Delivery Team";
                }
                oVisibleModel.setProperty("/cudVisible", bCudVisible);
                oVisibleModel.setProperty("/roleName", sRoleName);
            },
            setSelKey: function (sKey) {
                //   sap.ui.getCore().byId("idSN").setSelectedKey(sKey);
                this.getOwnerComponent()
                    .getModel("userModel")
                    .setProperty("/selectedKey", sKey);
                // var aData = this.getOwnerComponent().getModel("userModel").getProperty("/navigation");
                // aData.forEach(element => {
                //     if(element.key === sKey){

                //     }
                // });
                this.getOwnerComponent().getModel("userModel").refresh(true);
                // this.getView().byId("idNL").setSelectedKey(sKey);
            },
            getFormattedDate: function () {
                var today = new Date();
                var dd = today.getDate();

                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();
                if (dd < 10) {
                    dd = "0" + dd;
                }
                if (mm < 10) {
                    mm = "0" + mm;
                }
                return dd + '/' + mm + '/' + yyyy;
            },
            openCountryValueHelpDialog: function (oEvent) {
                var oView = this.getView();

                if (!this._pValueHelpDialog) {
                    this._pValueHelpDialog = Fragment.load({
                        id: oView.getId(),
                        name: "com.ferrero.zmrouiapp.view.fragments.CountryValueHelpDialog",
                        controller: this
                    }).then(function (oValueHelpDialog) {
                        oView.addDependent(oValueHelpDialog);
                        return oValueHelpDialog;
                    });
                }
                this._pValueHelpDialog.then(function (oValueHelpDialog) {
                    this._configValueHelpDialog();
                    oValueHelpDialog.open();
                }.bind(this));
            },
            countryValueHelpClose: function (oEvent, sFragmentID, sInputID, sTextID) {
                var oSelectedItem = oEvent.getParameter("selectedItem"),
                    oInput = this.byId(sap.ui.core.Fragment.createId(sFragmentID, sInputID));
                if (!oSelectedItem) {
                    oInput.resetProperty("value");
                    this.byId(sap.ui.core.Fragment.createId(sFragmentID, sTextID)).setText("");
                    return;
                }
                oInput.setValue(oSelectedItem.getTitle());
                this.byId(sap.ui.core.Fragment.createId(sFragmentID, sTextID)).setText(oSelectedItem.getDescription());
            },
            routeAuthValidation: async function (sRoute) {
                var oModel = this.getOwnerComponent().getModel("userModel");
                var oData = oModel.getData();
                var role = oData.role;
                var aCDTRoutes = ["vendorList", "pricingCond", "myInbox", "pricingNoti", "vendNoti"];
                var aLDTRoutes = ["pricingCond", "myInbox", "pricingNoti"];
                var aGCMRoutes = ["myInbox", "pricingNoti", "vendNoti", "vendorList", "pricingCond"];
                var aLPRoutes = ["myInbox", "pricingNoti", "pricingCond"];
                var oRouter = this.getOwnerComponent().getRouter();
                if (!role) {
                    await this.validateUser();
                }
                oData = oModel.getData();
                role = oData.role;
                if (role) {
                    if (role.role_role === "CDT") {
                        if (aCDTRoutes.includes(sRoute)) {
                            oRouter.navTo(sRoute);
                        } else {
                            oRouter.navTo("notFound");
                        }
                    } else if (role.role_role === "LDT") {
                        if (aLDTRoutes.includes(sRoute)) {
                            oRouter.navTo(sRoute);
                        } else {
                            oRouter.navTo("notFound");
                        }
                    } else if (role.role_role === "GCM") {
                        if (aGCMRoutes.includes(sRoute)) {
                            oRouter.navTo(sRoute);
                        } else {
                            oRouter.navTo("notFound");
                        }
                    } else if (role.role_role === "LP") {
                        if (aLPRoutes.includes(sRoute)) {
                            oRouter.navTo(sRoute);
                        } else {
                            oRouter.navTo("notFound");
                        }
                    } else {
                        this.getOwnerComponent().getRouter().navTo("notFound");
                        // window.location.reload();
                    }
                } else {
                    this.getOwnerComponent().getRouter().navTo("notFound");
                    // window.location.reload();
                }
            },
            validateUser: async function () {
                var oModel = this.getOwnerComponent().getModel();
                const info = await $.get(oModel.sServiceUrl + '/CheckUserRole');
                if (info.d.results) {
                    var aData = info.d.results;
                    this.prepareUserModel();
                    if (aData.length === 0) {
                        this.showNotFound();
                    } else {
                        this.getModel("userModel").setProperty("/isExpanded", true);
                        if (this.getOwnerComponent().getRouter().getHashChanger().getHash() === "notFound") {
                            this.getOwnerComponent().getRouter().navTo("search");
                        }
                        var role = aData[0].role_role;
                        this.buttonVisibility(role);
                        var sRoute;
                        var aSideNav = this.getModel("userModel").getProperty("/navigation");
                        if (role === "LDT" || role === "LP") {
                            aSideNav = aSideNav.filter(a => a.key !== "vendorList");
                            aSideNav = aSideNav.map(function (a) {
                                if (a.key === "myInbox") {
                                    a.items.splice(0, 1);
                                }
                                return a;
                            });
                            sRoute = "pricingCond";
                        } else if (role === "GCM") {
                            sRoute = "myInbox";
                            // aSideNav = aSideNav.filter(a => a.key === "myInbox");
                        } else {
                            sRoute = "vendorList";
                        }
                        this.getOwnerComponent().getModel("userModel").setProperty("/role", aData[0]);
                        this.getOwnerComponent().getModel("userModel").setProperty("/navigation", aSideNav);
                        this.getOwnerComponent().getRouter().navTo(sRoute);
                    }
                } else {
                    this.showNotFound();
                }
            },
            prepareUserModel: function () {
                var oObj = {
                    "selectedKey": "",
                    "navigation": [
                        {
                            "titleI18nKey": "scVendListTab",
                            "icon": "sap-icon://building",
                            "expanded": false,
                            "key": "vendorList"
                        },
                        {
                            "titleI18nKey": "scPriceConTab",
                            "icon": "sap-icon://money-bills",
                            "expanded": false,
                            "key": "pricingCond"
                        },
                        {
                            "titleI18nKey": "scMyInbox",
                            "icon": "sap-icon://inbox",
                            "expanded": true,
                            "key": "myInbox",
                            "items": [
                                {
                                    "title": "Vendor Notifications",
                                    "key": "vendNoti"
                                },
                                {
                                    "title": "Pricing Notifications",
                                    "key": "pricingNoti"
                                }
                            ]
                        }
                    ]
                };
                this.getOwnerComponent().getModel("userModel").setData(oObj);
            },
            showNotFound: function () {
                // sap.ui.getCore().byId("idSN").setExpanded(false);
                this.getOwnerComponent().getModel("userModel").setProperty("/isExpanded", false);
                this.getOwnerComponent().getModel("side").setProperty("/navigation", []);
                this.getOwnerComponent().getRouter().navTo("notFound");
            },
            buttonVisibility: function (role) {
                var oUserModel = this.getModel("userModel");
                var bVisiblePricingAddBtn = false,
                    bPricingVendorAddBtn = false;
                if (role === "CDT") {
                    bVisiblePricingAddBtn = true;
                    bPricingVendorAddBtn = true;
                } else {
                    bVisiblePricingAddBtn = false;
                    bPricingVendorAddBtn = false;
                }
                oUserModel.setProperty("/bVisiblePricingAddBtn", bVisiblePricingAddBtn);
                oUserModel.setProperty("/bPricingVendorAddBtn", bPricingVendorAddBtn);
            }
        });
    }
);
