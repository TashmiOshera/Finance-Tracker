[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xIbq4TFL)

💰 Personal Expense Tracker API


The Personal Expense Tracker API is a feature-rich financial management system designed to help users track expenses, set budgets, and analyze financial trends. Built with Node.js, Express, MongoDB, and JWT authentication, it ensures secure access, real-time insights, and personalized financial tracking.

🔹 Key Features

🔐 User Roles & Authentication 
💸 Expense & Income Tracking 
📊 Budget Management 
📑 Financial Reports 
🔔 Notifications & Alerts 
🎯 Goals & Savings Tracking 
💱 Multi-Currency Support 
📌 Role-Based Dashboard 


🌟All API END POINTS

Users

router.post('/register', registerUser); 
router.post('/login', loginUser); 
router.get('/profile', protect, getProfile); 
router.get('/admin/users', protect, admin, getAllUsers); 
router.get('/admin/users/:id', protect, admin, getUserById); 
router.put('/admin/users/:id', protect, admin, updateUser); 
router.delete('/admin/users/:id', protect, admin, deleteUser); 


ransactions

router.get('/all', protect, adminOnly, transactionController.getAllTransactions);
router.get('/reports', protect, adminOnly, transactionController.getAdminFinancialReport); 
router.post('/', protect, transactionController.addTransaction); 
router.put('/:id', protect, transactionController.editTransaction); 
router.delete('/:id', protect, transactionController.deleteTransaction); 
router.get('/', protect, transactionController.getAllTransactions); 
router.get('/:id', protect, transactionController.getTransactionById); 
router.get('/tags/:tags', protect, transactionController.getTransactionsByTag); 


Settings

router.post("/", protect, admin, configureSystemSettings);
router.get("/", protect, getSystemSettings);


Reports

router.get('/', protect, getFinancialReport);


Notifications

router.get('/', protect,)


Goals 

router.post('/', protect, addGoal);
router.get('/', protect, getGoals);
router.put('/:id', protect, updateGoal);
router.delete('/:id', protect, deleteGoal);


Dashboard 

router.get('/dashboard', protect, getDashboardData);


Budget

router.post('/', protect, createBudget); 
router.get('/', protect, getUserBudgets);
router.get('/recommendations', protect, getBudgetRecommendations); 
router.get('/category/:category', protect, getBudgetByCategory);
router.delete('/category/:category', protect, deleteBudgetByCategory);
router.put('/:id', protect, updateBudget);


Environmant Variables

EMAIL_USER="osheratashmi@gmail.com"
EMAIL_PASS="qcms pmbe cjnr vzit"
JWT_SECRET="tashmi"

Testing Part

npm test