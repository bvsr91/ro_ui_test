sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/ferrero/zmrouiapp/model/models"
],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("com.ferrero.zmrouiapp.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
                this.prepareUserModel();
                this.validateUser();
            },
            validateUser: async function () {
                var oModel = this.getModel();
                const info = await $.get(oModel.sServiceUrl + '/CheckUserRole');
                if (info.d.results) {
                    var aData = info.d.results;
                    this.prepareUserModel();
                    if (aData.length === 0) {
                        this.showNotFound();
                    } else {
                        this.buttonVisibility(aData[0].role_role);
                        this.getModel("userModel").setProperty("/isExpanded", true);
                        if (this.getRouter().getHashChanger().getHash() === "notFound") {
                            this.getRouter().navTo("search");
                        }
                        var role = aData[0].role_role;
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
                        }
                        else if (role === "GCM") {
                            sRoute = "myInbox";
                            // aSideNav = aSideNav.filter(a => a.key === "myInbox");
                        } else {
                            sRoute = "vendorList";
                        }
                        this.getModel("userModel").setProperty("/role", aData[0]);
                        this.getModel("userModel").setProperty("/navigation", aSideNav);
                        this.getRouter().navTo(sRoute);
                    }
                } else {
                    this.showNotFound();
                }
            },
            showNotFound: function () {
                // sap.ui.getCore().byId("idSN").setExpanded(false);
                this.getModel("userModel").setProperty("/isExpanded", false);
                this.getModel("side").setProperty("/navigation", []);
                this.getRouter().navTo("notFound");
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
                this.getModel("userModel").setData(oObj);
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