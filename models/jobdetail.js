const mongoose = require("mongoose");

const jobDetailSchema = new mongoose.Schema({
  title: { type: String, required: true },
  jobTime: { type: String, required: true },
  salary: { type: String },
  location: { type: String, required: true },
  description: { type: String },
  contact: { type: String, required: true },

  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  //  NEW: apply karne wale workers
  applicants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],

  // accepted / rejected lists maintained separately so we don't need
  // a breaking change to the existing applicants array
  acceptedApplicants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],

  rejectedApplicants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("JobDetail", jobDetailSchema);
