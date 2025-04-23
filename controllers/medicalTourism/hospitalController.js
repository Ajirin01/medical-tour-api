const GeneralController = require('./GeneralController');
const Hospital = require('../../models/medicalTourism/Hospital');

class HospitalController extends GeneralController {
    constructor() {
        super(Hospital);
    }
}

module.exports = {
    HospitalController: new HospitalController()
};
