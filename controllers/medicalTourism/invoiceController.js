const GeneralController = require('./GeneralController');
const Invoice = require('../../models/medicalTourism/Invoice');

class InvoiceController extends GeneralController {
    constructor() {
        super(Invoice);
    }
}

module.exports = {
    InvoiceController: new InvoiceController()
};
