const express = require('express');
const router = express.Router();

// Controller
const controller = require('../controllers/controler');

/* =====================
   PUBLIC PAGES
===================== */

// Home
router.get('/', controller.getHome);

// Profile
router.get('/profile', controller.getAbout);

/* =====================
   JOB ROUTES
===================== */

// All jobs list
router.get('/jobs', controller.getJobs);

// Single job details
router.get('/jobs/:jobId', controller.getJobDetail);

// Post job (Employer)
router.get('/post-job', controller.getPostJob);
router.post('/post-job', controller.postJob);

// Delete job (only owner employer)
router.post('/jobs/:jobId/delete', controller.deleteJob);

// Apply job (Worker)
router.post('/jobs/:jobId/apply', controller.applyJob);

// Applicant management (Employer only)
router.post(
  '/jobs/:jobId/applicants/:applicantId/accept',
  controller.acceptApplicant
);

router.post(
  '/jobs/:jobId/applicants/:applicantId/reject',
  controller.rejectApplicant
);

router.post(
  '/jobs/:jobId/applicants/:applicantId/remove',
  controller.removeApplicant
);

/* =====================
   AUTH ROUTES
===================== */

// Signup
router.get('/signup', controller.getSignUp);
router.post('/signup', controller.postSignUp);

// Login
router.get('/login', controller.getLogin);
router.post('/login', controller.postLogin);

// Logout
router.get('/logout', controller.getLogout);

module.exports = router;
