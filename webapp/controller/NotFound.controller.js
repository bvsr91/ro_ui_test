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
            },
            onReload: function () {
                this.getRouter().navTo("search");
                // jQuery("body").load(window.location.href);
                window.location.reload();
            }
        });
    }
);
