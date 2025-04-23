const mongoose = require("mongoose");

const healthQuestionnaireSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
  
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  date: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female"], required: true },

  general: {
    goodHealth: Boolean,
    fatigue: Boolean,
    weightGain: Boolean,
    weightLoss: Boolean,
    familyMedicalHistory: Boolean
  },

  headachesAndBalance: {
    severeHeadaches: Boolean,
    numbness: Boolean,
    dizziness: Boolean
  },

  vision: {
    visionChanges: Boolean,
    doubleVision: Boolean,
    eyeInfections: Boolean,
    eyeIrritation: Boolean
  },

  ent: {
    hearingProblems: Boolean,
    earBuzzing: Boolean,
    earInfections: Boolean,
    sinusProblems: Boolean,
    dentalProblems: Boolean,
    mouthSores: Boolean,
    chewingDifficulty: Boolean
  },

  heart: {
    chestPain: Boolean,
    palpitations: Boolean,
    legSwelling: Boolean
  },

  respiratory: {
    breathShortness: Boolean,
    cough: Boolean,
    wheezing: Boolean,
    mucus: Boolean
  },

  stomachAndBowel: {
    nausea: Boolean,
    indigestion: Boolean,
    swallowingProblem: Boolean,
    stomachPain: Boolean,
    diarrhoea: Boolean,
    constipation: Boolean,
    bowelChange: Boolean,
    stoolColorChange: Boolean,
    bloodInStool: Boolean
  },

  urinary: {
    urineProblems: Boolean,
    frequentUrination: Boolean,
    painUrination: Boolean,
    bloodInUrine: Boolean,
    incontinence: Boolean,
    urgency: Boolean,
    nightUrination: Boolean
  },

  backAndJoints: {
    backNeckProblems: Boolean,
    jointProblems: Boolean,
    jointSwelling: Boolean
  },

  skin: {
    skinProblems: Boolean,
    moleConcerns: Boolean
  },

  mentalHealth: {
    depression: Boolean,
    anxiety: Boolean,
    sleepProblems: Boolean
  },

}, { timestamps: true });

module.exports = mongoose.model("HealthQuestionnaire", healthQuestionnaireSchema);
