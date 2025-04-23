const GeneralController = require('./GeneralController');
const HospitalService = require('../../models/medicalTourism/HospitalService');

class HospitalServiceController extends GeneralController {
    constructor() {
        super(HospitalService);
    }
}

module.exports = {
    HospitalServiceController: new HospitalServiceController()
};
