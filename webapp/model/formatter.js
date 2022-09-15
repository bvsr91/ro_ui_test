sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Rounds the currency value to 2 digits
         *
         * @public
         * @param {string} sValue value to be formatted
         * @returns {string} formatted currency value with 2 digits
         */
        getBundleText: function (sId) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sId);
        },
        countryFormat: function (sCountry, sCountryCode) {
            if (sCountryCode !== "" && sCountryCode) {
                return sCountry + " (" + sCountryCode + ")";
            } else {
                return sCountry;
            }
        },

        statusState: function (status) {
            if (status === "Approved") {
                return "Success";
            } else if (status === "Pending") {
                return "Warning";
            } else if (status === "Rejected") {
                return "Error";
            } else {
                return "None";
            }
        },
        loExchangeRateFormatter: function (bFlag, sRole) {
            // if (flag === true) {
            switch (sRole) {
                case "CDT":
                    return !bFlag;
                case "LDT":
                    return bFlag;
                default:
                    return false;
            }
        },
        formatDate: function (oDate) {
            if (oDate !== null) {
                var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    pattern: "dd/MM/yyyy"
                });
                return dateFormat.format(oDate);
            }
        }
    };
});
