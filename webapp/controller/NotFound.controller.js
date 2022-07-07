sap.ui.define(
    [
        "./BaseController",
        "../model/formatter"
    ],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (
        BaseController,
        formatter
    ) {
        "use strict";

        return BaseController.extend("com.ferrero.zmrouiapp.controller.NotFound", {
            formatter: formatter,
            onInit: function () {
                this.getRouter().getRoute("notFound").attachPatternMatched(this._onRouteMatched, this);
                var that = this;
                var oHashChanger = new sap.ui.core.routing.HashChanger.getInstance();
                oHashChanger.attachEvent("hashChanged", function (oEvent) {
                    that.routeAuthValidation(oHashChanger.getHash());
                });
            },
            _onRouteMatched: function () {
                //Set the layout property of the FCL control to 'OneColumn'
                // this.getModel("appView").setProperty("/layout", "OneColumn");
                this.getOwnerComponent().getModel("userModel").setProperty("/navigation", []);

            },
            onReload: function () {
                this.getRouter().navTo("search");
                // jQuery("body").load(window.location.href);
                window.location.reload();
            }
        });
    }
);
