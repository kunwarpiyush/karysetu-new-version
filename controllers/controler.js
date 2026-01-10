const User = require('../models/user');
const JobDetail = require('../models/jobdetail');
const notify = require('../utils/notify');

/* ======================
   COMMON HELPERS
====================== */

// Session data (navbar + auth)
const getSessionData = (req) => ({
  isLoggedIn: req.session?.isLoggedIn || false,
  user: req.session?.user || null,
  role: req.session?.user?.role || null
});

// Jobs data
// ✅ ONLY CHANGE: applicants populate added
const getJobsData = async () => {
  return await JobDetail.find()
    .populate('employer')
    .populate('applicants'); // 👈 IMPORTANT (Apply button fix)
};

/* ======================
   PAGES
====================== */

// HOME
exports.getHome = async (req, res, next) => {
  try {
    const jobs = await getJobsData();
    res.render('home', {
      pageTitle: 'Home',
      path: '/',
      jobs,
      ...getSessionData(req)
    });
  } catch (err) {
    next(err);
  }
};

// PROFILE
exports.getAbout = async (req, res) => {
  try {
    let postedJobs = [];
    let acceptedJobs = [];
    let rejectedJobs = [];

    if (req.session?.user?.role === 'employer') {
      postedJobs = await JobDetail.find({
        employer: req.session.user._id
      }).populate('applicants');
    }

    if (req.session?.user?.role === 'worker') {
      acceptedJobs = await JobDetail.find({
        acceptedApplicants: req.session.user._id
      }).populate('employer');

      rejectedJobs = await JobDetail.find({
        rejectedApplicants: req.session.user._id
      }).populate('employer');
    }

    res.render('about', {
      pageTitle: 'Profile',
      path: '/profile',
      postedJobs,
      acceptedJobs,
      rejectedJobs,
      ...getSessionData(req)
    });
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
};

// JOBS LIST
exports.getJobs = async (req, res, next) => {
  try {
    const jobs = await getJobsData();
    res.render('jobs', {
      pageTitle: 'Jobs',
      path: '/jobs',
      jobs,
      ...getSessionData(req)
    });
  } catch (err) {
    next(err);
  }
};

// JOB DETAIL
exports.getJobDetail = async (req, res, next) => {
  try {
    const job = await JobDetail
      .findById(req.params.jobId)
      .populate('employer')
      .populate('applicants');

    if (!job) return res.redirect('/jobs');

    res.render('details', {
      pageTitle: job.title,
      path: '/jobs',
      job,
      ...getSessionData(req)
    });
  } catch (err) {
    next(err);
  }
};

// POST JOB PAGE
exports.getPostJob = (req, res) => {
  res.render('post-job', {
    pageTitle: 'Post Job',
    path: '/post-job',
    ...getSessionData(req)
  });
};

/* ======================
   AUTH PAGES
====================== */

exports.getSignUp = (req, res) => {
  res.render('signup', {
    pageTitle: 'Sign Up',
    path: '/signup',
    isLoggedIn: false,
    role: null,
    oldInput: {
      Name: '',
      Mobile: '',
      role: '',
      Aadhar_cardNumber: ''
    }
  });
};

exports.getLogin = (req, res) => {
  res.render('login', {
    pageTitle: 'Login',
    path: '/login',
    isLoggedIn: false,
    role: null
  });
};

/* ======================
   SIGNUP
====================== */

exports.postSignUp = async (req, res, next) => {
  try {
    const { Name, Mobile, role, Password, Aadhar_cardNumber } = req.body;

    if (!Name || !Mobile || !role || !Password || !Aadhar_cardNumber) {
      return res.render('signup', {
        pageTitle: 'Sign Up',
        path: '/signup',
        isLoggedIn: false,
        role: null,
        oldInput: req.body
      });
    }

    const existing = await User.findOne({ Mobile });
    if (existing) {
      return res.render('signup', {
        pageTitle: 'Sign Up',
        path: '/signup',
        isLoggedIn: false,
        role: null,
        oldInput: req.body
      });
    }

    await new User({
      Name,
      Mobile,
      role,
      Password,
      Aadhar_cardNumber
    }).save();

    res.redirect('/login');
  } catch (err) {
    next(err);
  }
};

exports.postLogin = async (req, res, next) => {
  try {
    const { Mobile, Password } = req.body;

    const user = await User.findOne({ Mobile });

    // ❌ Mobile ya password galat
    if (!user || user.Password !== Password) {
      return res.render('login', {
        pageTitle: 'Login',
        path: '/login',
        isLoggedIn: false,
        role: null,
        errorMessage: '❌ मोबाइल नंबर या पासवर्ड गलत है'
      });
    }

    // ✅ Login success
    req.session.isLoggedIn = true;
    req.session.user = user;

    req.session.save(() => {
      res.redirect('/');
    });

  } catch (err) {
    next(err);
  }
};


/* ======================
   LOGOUT
====================== */

exports.getLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

/* ======================
   POST JOB (EMPLOYER)
====================== */

exports.postJob = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn || req.session.user.role !== 'employer') {
      return res.redirect('/login');
    }

    const { title, jobTime, salary, location, description, contact } = req.body;

    await new JobDetail({
      title,
      jobTime,
      salary,
      location,
      description,
      contact,
      employer: req.session.user._id
    }).save();

    res.redirect('/jobs');
  } catch (err) {
    next(err);
  }
};

/* ======================
   DELETE JOB (ONLY OWNER)
====================== */

exports.deleteJob = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    if (req.session.user.role !== 'employer') return res.status(403).send('Unauthorized');

    const job = await JobDetail.findById(req.params.jobId);
    if (!job) return res.redirect('/jobs');

    if (job.employer.toString() !== req.session.user._id.toString()) {
      return res.status(403).send('Not allowed');
    }

    await JobDetail.findByIdAndDelete(req.params.jobId);
    res.redirect('/jobs');
  } catch (err) {
    next(err);
  }
};

/* ======================
   APPLY JOB (WORKER)
====================== */

exports.applyJob = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    if (req.session.user.role !== 'worker') return res.status(403).send('Only workers can apply');

    const job = await JobDetail.findById(req.params.jobId);
    if (!job) return res.redirect('/jobs');

    if (job.applicants.includes(req.session.user._id)) {
      return res.redirect(`/jobs/${req.params.jobId}`);
    }

    job.applicants.push(req.session.user._id);
    await job.save();

    res.redirect(`/jobs/${req.params.jobId}`);
  } catch (err) {
    next(err);
  }
};

/* ======================
   ACCEPT APPLICANT
====================== */

exports.acceptApplicant = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    if (req.session.user.role !== 'employer') return res.status(403).send('Unauthorized');

    const { jobId, applicantId } = req.params;
    const job = await JobDetail.findById(jobId);
    if (!job) return res.redirect('/jobs');

    if (job.employer.toString() !== req.session.user._id.toString()) {
      return res.status(403).send('Not allowed');
    }

    if (!job.acceptedApplicants.map(a => a.toString()).includes(applicantId)) {
      job.acceptedApplicants.push(applicantId);
    }

    job.rejectedApplicants =
      job.rejectedApplicants.filter(a => a.toString() !== applicantId);

    await job.save();
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

/* ======================
   REJECT APPLICANT
====================== */

exports.rejectApplicant = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    if (req.session.user.role !== 'employer') return res.status(403).send('Unauthorized');

    const { jobId, applicantId } = req.params;
    const job = await JobDetail.findById(jobId);
    if (!job) return res.redirect('/jobs');

    if (!job.rejectedApplicants.map(a => a.toString()).includes(applicantId)) {
      job.rejectedApplicants.push(applicantId);
    }

    job.acceptedApplicants =
      job.acceptedApplicants.filter(a => a.toString() !== applicantId);

    await job.save();
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

/* ======================
   REMOVE APPLICANT
====================== */

exports.removeApplicant = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn) return res.redirect('/login');
    if (req.session.user.role !== 'employer') return res.status(403).send('Unauthorized');

    const { jobId, applicantId } = req.params;
    const job = await JobDetail.findById(jobId);
    if (!job) return res.redirect('/jobs');

    job.applicants =
      job.applicants.filter(a => a.toString() !== applicantId);
    job.acceptedApplicants =
      job.acceptedApplicants.filter(a => a.toString() !== applicantId);
    job.rejectedApplicants =
      job.rejectedApplicants.filter(a => a.toString() !== applicantId);

    await job.save();
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};
