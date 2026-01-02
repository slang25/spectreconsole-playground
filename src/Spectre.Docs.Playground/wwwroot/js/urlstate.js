// URL state management for sharing playground code
window.urlStateInterop = {
    /**
     * Gets the current URL hash (without the # prefix).
     * @returns {string} The hash value, or empty string if none.
     */
    getHash: function() {
        const hash = window.location.hash;
        return hash ? hash.substring(1) : '';
    },

    /**
     * Sets the URL hash without triggering a page reload.
     * @param {string} value - The value to set (will be prefixed with #).
     */
    setHash: function(value) {
        if (value) {
            history.replaceState(null, '', '#' + value);
        } else {
            // Remove hash entirely if empty
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }
};
