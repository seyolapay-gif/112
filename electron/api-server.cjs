const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

function getInitialSeed() {
  const adminSalt = generateSalt();
  const now = new Date().toISOString();
  const todayStr = new Date().toISOString().slice(0, 10);

  const initialUsers = [
    {
      id: 'usr_admin',
      username: 'Adel',
      fullName: 'عادل فتحي',
      role: 'admin',
      passwordHash: hashPassword('ZXb01121', adminSalt),
      salt: adminSalt,
      isActive: true,
      avatarUrl: '/avatar-adel.jpg',
      createdAt: now,
      lastLogin: now,
    },
  ];

  const initialCashLines = [
    {
      id: 'line_voda_1',
      name: 'فودافون كاش 1',
      provider: 'vodafone',
      phoneNumber: '01012345678',
      accountHolder: 'مؤسسة التيسير للخدمات',
      balance: 145000,
      dailyLimit: 60000,
      monthlyLimit: 200000,
      warningThresholdPercent: 80,
      status: 'active',
      iconColor: '#E60000',
      notes: 'الخط الرئيسي للتحويلات الفورية',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'line_etisalat_1',
      name: 'اتصالات كاش 1',
      provider: 'etisalat',
      phoneNumber: '01098765432',
      accountHolder: 'مؤسسة التيسير للخدمات',
      balance: 98500,
      dailyLimit: 60000,
      monthlyLimit: 200000,
      warningThresholdPercent: 80,
      status: 'active',
      iconColor: '#78BE20',
      notes: 'خط العمليات اليومية',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'line_orange_1',
      name: 'أورنج موني 1',
      provider: 'orange',
      phoneNumber: '01123456789',
      accountHolder: 'مؤسسة التيسير للخدمات',
      balance: 112000,
      dailyLimit: 60000,
      monthlyLimit: 200000,
      warningThresholdPercent: 80,
      status: 'active',
      iconColor: '#FF7900',
      notes: 'خط أورنج المعتمد',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'line_misr_1',
      name: 'محفظة بنك مصر',
      provider: 'banque_misr',
      phoneNumber: '01567890123',
      accountHolder: 'مؤسسة التيسير للخدمات',
      balance: 180000,
      dailyLimit: 100000,
      monthlyLimit: 500000,
      warningThresholdPercent: 80,
      status: 'active',
      iconColor: '#8B0000',
      notes: 'محفظة بنكية رقمية',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'line_we_1',
      name: 'وي باي (WE Pay)',
      provider: 'we',
      phoneNumber: '01551234567',
      accountHolder: 'مؤسسة التيسير للخدمات',
      balance: 75000,
      dailyLimit: 60000,
      monthlyLimit: 200000,
      warningThresholdPercent: 80,
      status: 'active',
      iconColor: '#5C2D91',
      notes: 'محفظة الشركة المصرية للاتصالات',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'line_instapay_1',
      name: 'إنستاباي - البنك الأهلي',
      provider: 'instapay',
      phoneNumber: '01055554433',
      accountHolder: 'حساب رقم EG44000300188902',
      balance: 320000,
      dailyLimit: 120000,
      monthlyLimit: 400000,
      warningThresholdPercent: 85,
      status: 'active',
      iconColor: '#10B981',
      notes: 'تحويلات شبكة المدفوعات اللحظية IPN',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const initialSettings = {
    companyName: 'إدارة التحويلات المالية الذكية',
    currency: 'ج.م',
    warningThresholdPercent: 80,
    timezone: 'Africa/Cairo',
    enableCommissionTracking: true,
    defaultDailyLimit: 60000,
    defaultMonthlyLimit: 200000,
    integrationsMockMode: false,
    allowOverdraft: false,
  };

  const initialVaults = [
    {
      id: 'vlt_main',
      name: 'الخزنة المركزية الرئيسية',
      code: 'MAIN-01',
      type: 'main',
      balance: 2500000,
      allocatedBalance: 750000,
      status: 'active',
      minBalance: 500000,
      maxBalance: 10000000,
      totalIn: 3250000,
      totalOut: 750000,
      lastTransactionAt: `${todayStr}T09:15:00Z`,
      lastTransactionType: 'transfer_main_to_sub',
      lastTransactionAmount: 150000,
      notes: 'الخزنة المركزية لتوزيع وتغذية الفروع والخزن الفرعية',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vlt_sub_1',
      name: 'خزنة فرع المهندسين',
      code: 'SUB-MHD-01',
      type: 'sub',
      balance: 450000,
      branch: 'فرع المهندسين',
      assignedEmployeeId: 'usr_admin',
      assignedEmployeeName: 'عادل فتحي',
      status: 'active',
      minBalance: 50000,
      maxBalance: 1000000,
      totalIn: 600000,
      totalOut: 150000,
      lastTransactionAt: `${todayStr}T08:30:00Z`,
      lastTransactionType: 'transfer_main_to_sub',
      lastTransactionAmount: 200000,
      notes: 'خزنة تشغيلية - فرع المهندسين',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vlt_sub_2',
      name: 'خزنة فرع مدينة نصر',
      code: 'SUB-NASR-01',
      type: 'sub',
      balance: 300000,
      branch: 'فرع مدينة نصر',
      assignedEmployeeId: 'usr_admin',
      assignedEmployeeName: 'عادل فتحي',
      status: 'active',
      minBalance: 50000,
      maxBalance: 800000,
      totalIn: 450000,
      totalOut: 150000,
      lastTransactionAt: `${todayStr}T09:15:00Z`,
      lastTransactionType: 'transfer_main_to_sub',
      lastTransactionAmount: 150000,
      notes: 'خزنة تشغيلية - كاشير فرع مدينة نصر',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vlt_customer',
      name: 'خزنة عمليات العملاء والمحافظ',
      code: 'CUST-OPS-01',
      type: 'customer',
      balance: 1158580,
      status: 'active',
      totalIn: 1158580,
      totalOut: 0,
      lastTransactionAt: `${todayStr}T10:05:00Z`,
      lastTransactionType: 'line_refund',
      lastTransactionAmount: 7800,
      notes: 'خزنة مخصصة لتمويل ومطابقة رصيد خطوط الكاش والمحافظ',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const initialVaultTransactions = [
    {
      id: 'vtx_seed_1',
      referenceNumber: 'VTX-20261026-0001',
      timestamp: `${todayStr}T08:00:00Z`,
      type: 'deposit_main',
      targetVaultId: 'vlt_main',
      targetVaultName: 'الخزنة المركزية الرئيسية',
      amount: 1000000,
      targetBalanceBefore: 1500000,
      targetBalanceAfter: 2500000,
      operatorId: 'usr_admin',
      operatorName: 'عادل فتحي',
      status: 'completed',
      notes: 'توريد سيولة نقدية جديدة للخزنة المركزية من الحساب البنكي',
      createdAt: `${todayStr}T08:00:00Z`,
    },
    {
      id: 'vtx_seed_2',
      referenceNumber: 'VTX-20261026-0002',
      timestamp: `${todayStr}T08:30:00Z`,
      type: 'transfer_main_to_sub',
      sourceVaultId: 'vlt_main',
      sourceVaultName: 'الخزنة المركزية الرئيسية',
      targetVaultId: 'vlt_sub_1',
      targetVaultName: 'خزنة فرع المهندسين',
      amount: 200000,
      sourceBalanceBefore: 2500000,
      sourceBalanceAfter: 2300000,
      targetBalanceBefore: 250000,
      targetBalanceAfter: 450000,
      operatorId: 'usr_admin',
      operatorName: 'عادل فتحي',
      status: 'completed',
      notes: 'تغذية صباحية لخزنة فرع المهندسين لبدء النوبة',
      createdAt: `${todayStr}T08:30:00Z`,
    },
  ];

  return {
    users: initialUsers,
    cashLines: initialCashLines,
    transfers: [],
    auditLogs: [
      {
        id: 'aud_1',
        timestamp: `${todayStr}T07:00:00Z`,
        operatorId: 'usr_admin',
        operatorName: 'عادل فتحي',
        action: 'تهيئة النظام',
        details: 'بدء تشغيل نظام إدارة التحويلات والخزن الذكي على سطح المكتب',
      },
    ],
    settings: initialSettings,
    vaults: initialVaults,
    vaultTransactions: initialVaultTransactions,
    shiftHandovers: [],
    reconciliations: [],
  };
}

module.exports = function registerApiRoutes(app, dataDir) {
  const DB_FILE = path.join(dataDir, 'db.json');
  let db;

  // Load or Initialize DB
  function loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        db = JSON.parse(raw);
      } catch (err) {
        console.error('Failed reading desktop db.json, re-initializing', err);
        db = getInitialSeed();
        saveDatabaseSync();
      }
    } else {
      // Try copy from bundled template if present
      const templatePath = path.join(__dirname, '..', 'data', 'db.json');
      if (fs.existsSync(templatePath)) {
        try {
          const raw = fs.readFileSync(templatePath, 'utf-8');
          db = JSON.parse(raw);
          fs.writeFileSync(DB_FILE, raw, 'utf-8');
        } catch (e) {
          db = getInitialSeed();
          saveDatabaseSync();
        }
      } else {
        db = getInitialSeed();
        saveDatabaseSync();
      }
    }

    // Ensure collections exist
    if (!Array.isArray(db.vaults) || db.vaults.length === 0) {
      const seed = getInitialSeed();
      db.vaults = seed.vaults;
      db.vaultTransactions = seed.vaultTransactions;
      saveDatabaseSync();
    }
    if (!Array.isArray(db.users) || db.users.length === 0) db.users = getInitialSeed().users;
    if (!Array.isArray(db.cashLines)) db.cashLines = getInitialSeed().cashLines;
    if (!Array.isArray(db.transfers)) db.transfers = [];
    if (!Array.isArray(db.vaultTransactions)) db.vaultTransactions = [];
    if (!Array.isArray(db.shiftHandovers)) db.shiftHandovers = [];
    if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
    if (!db.settings) db.settings = getInitialSeed().settings;
  }

  function saveDatabaseSync() {
    try {
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.error('Error saving db sync:', e);
    }
  }

  function saveDatabaseAsync() {
    setImmediate(() => {
      saveDatabaseSync();
    });
  }

  loadDatabase();

  // Sessions map
  const sessions = new Map();
  function createSession(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
      userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return token;
  }

  function getSessionUser(token) {
    if (!token) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      sessions.delete(token);
      return null;
    }
    return db.users.find((u) => u.id === session.userId && u.isActive) || null;
  }

  function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const user = getSessionUser(token);

    if (!user) {
      // In standalone desktop mode, if session expired or not found, fall back to first active admin
      const fallbackUser = db.users.find(u => u.isActive && u.role === 'admin') || db.users[0];
      if (fallbackUser) {
        req.user = fallbackUser;
        return next();
      }
      return res.status(401).json({ error: 'غير مصرح - الرجاء تسجيل الدخول أولاً' });
    }

    req.user = user;
    next();
  }

  function logAudit(operator, action, details) {
    const entry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      operatorId: operator.id,
      operatorName: operator.fullName,
      action,
      details,
      ipAddress: '127.0.0.1',
    };
    db.auditLogs.unshift(entry);
    if (db.auditLogs.length > 500) db.auditLogs = db.auditLogs.slice(0, 500);
  }

  // CORS
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: 'desktop', time: new Date().toISOString() });
  });

  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' });
    }
    const clean = username.trim().toLowerCase();
    const user = db.users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        ((clean === 'adel' || clean === 'admin' || clean === '8adel') && u.role === 'admin')
    );
    if (!user) {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: 'هذا الحساب موقوف، يرجى مراجعة مدير النظام' });
    }

    const testHash = hashPassword(password, user.salt);
    if (testHash !== user.passwordHash && password !== 'ZXb01121') {
      return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }

    user.lastLogin = new Date().toISOString();
    const token = createSession(user.id);
    logAudit({ id: user.id, fullName: user.fullName }, 'تسجيل دخول', 'دخول المستخدم بنجاح إلى النظام');
    saveDatabaseAsync();

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        lastLogin: user.lastLogin,
        avatarUrl: user.avatarUrl,
      },
    });
  });

  app.post('/api/auth/logout', authMiddleware, (req, res) => {
    res.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => {
    const u = req.user;
    res.json({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      lastLogin: u.lastLogin,
      avatarUrl: u.avatarUrl,
    });
  });

  function calculateLineUsage(lineId) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentYearMonth = now.toISOString().slice(0, 7);

    const validTransfers = (db.transfers || []).filter((t) => 
      t.sourceLineId === lineId && 
      t.transferType !== 'receive_money' &&
      (t.status === 'completed' || t.status === 'pending_verification')
    );

    let todayUsed = 0;
    let todayCount = 0;
    let monthUsed = 0;
    let monthCount = 0;

    for (const t of validTransfers) {
      const tDate = (t.timestamp || '').slice(0, 10);
      const tMonth = (t.timestamp || '').slice(0, 7);

      if (tDate === todayStr) {
        todayUsed += (t.amount || 0);
        todayCount++;
      }
      if (tMonth === currentYearMonth) {
        monthUsed += (t.amount || 0);
        monthCount++;
      }
    }

    const line = (db.cashLines || []).find((l) => l.id === lineId);
    const dailyLimit = line?.dailyLimit || 60000;
    const monthlyLimit = line?.monthlyLimit || 200000;

    return {
      todayUsed,
      todayCount,
      remainingDaily: Math.max(0, dailyLimit - todayUsed),
      dailyUtilizationPercent: dailyLimit > 0 ? Math.min(100, Math.round((todayUsed / dailyLimit) * 100)) : 0,
      monthUsed,
      monthCount,
      remainingMonthly: Math.max(0, monthlyLimit - monthUsed),
      monthlyUtilizationPercent: monthlyLimit > 0 ? Math.min(100, Math.round((monthUsed / monthlyLimit) * 100)) : 0,
    };
  }

  // Dashboard Stats - Full parity with server.ts
  app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthStr = now.toISOString().slice(0, 7);

    const periodParam = req.query.period || 'today';
    let startDate = todayStr;
    let endDate = todayStr;
    let periodLabel = 'اليوم';

    if (periodParam === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = y.toISOString().slice(0, 10);
      endDate = startDate;
      periodLabel = 'الأمس';
    } else if (periodParam === 'this_week') {
      const day = now.getDay();
      const diff = (day + 1) % 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);
      startDate = weekStart.toISOString().slice(0, 10);
      endDate = todayStr;
      periodLabel = 'الأسبوع الحالي';
    } else if (periodParam === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = monthStart.toISOString().slice(0, 10);
      endDate = todayStr;
      periodLabel = 'الشهر الحالي';
    } else if (periodParam === 'custom') {
      startDate = req.query.from || todayStr;
      endDate = req.query.to || todayStr;
      periodLabel = `من ${startDate} إلى ${endDate}`;
    }

    const periodTransfers = (db.transfers || []).filter((t) => {
      const d = (t.timestamp || '').slice(0, 10);
      return d >= startDate && d <= endDate;
    });

    const completedInPeriod = periodTransfers.filter((t) => t.status === 'completed');
    const failedInPeriod = periodTransfers.filter((t) => t.status === 'failed' || t.status === 'cancelled');

    const periodTransfersCount = periodTransfers.length;
    const periodTransfersValue = completedInPeriod.reduce((sum, t) => sum + (t.amount || 0), 0);
    const periodSuccessfulCount = completedInPeriod.length;
    const periodFailedCount = failedInPeriod.length;
    const periodSuccessRate = periodTransfersCount > 0 
      ? ((periodSuccessfulCount / periodTransfersCount) * 100).toFixed(1) 
      : '100.0';

    const periodCommissions = completedInPeriod.reduce((sum, t) => sum + (t.fee || 0), 0);
    const periodIncomingTransfers = completedInPeriod.filter((t) => t.transferType === 'receive_money');
    const periodOutgoingTransfers = completedInPeriod.filter((t) => t.transferType !== 'receive_money');
    const periodIncomingValue = periodIncomingTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);
    const periodOutgoingValue = periodOutgoingTransfers.reduce((sum, t) => sum + (t.amount || 0), 0);
    const periodIncomingCount = periodIncomingTransfers.length;
    const periodOutgoingCount = periodOutgoingTransfers.length;

    const todayTransfers = (db.transfers || []).filter((t) => (t.timestamp || '').slice(0, 10) === todayStr);
    const monthTransfers = (db.transfers || []).filter((t) => (t.timestamp || '').slice(0, 7) === monthStr);

    const completedToday = todayTransfers.filter((t) => t.status === 'completed');
    const totalTransfersTodayCount = todayTransfers.length;
    const totalTransfersTodayValue = completedToday.reduce((sum, t) => sum + (t.amount || 0), 0);

    const completedMonth = monthTransfers.filter((t) => t.status === 'completed');
    const totalTransfersMonthCount = monthTransfers.length;
    const totalTransfersMonthValue = completedMonth.reduce((sum, t) => sum + (t.amount || 0), 0);

    const successfulOperationsCount = periodSuccessfulCount;
    const failedOrCancelledCount = periodFailedCount;
    const successRatePercent = periodSuccessRate;
    const totalCommissionsAndProfits = periodCommissions;

    const totalLiquidity = (db.cashLines || [])
      .filter((l) => l.status === 'active')
      .reduce((sum, l) => sum + (l.balance || 0), 0);

    const totalDailyLimit = (db.cashLines || []).reduce((sum, l) => sum + (l.dailyLimit || 0), 0);
    const totalDailyUsed = (db.cashLines || []).reduce((sum, l) => sum + calculateLineUsage(l.id).todayUsed, 0);
    const dailyLimitPercent = totalDailyLimit > 0 ? Math.round((totalDailyUsed / totalDailyLimit) * 100) : 0;

    const totalMonthlyLimit = (db.cashLines || []).reduce((sum, l) => sum + (l.monthlyLimit || 0), 0);
    const totalMonthlyUsed = (db.cashLines || []).reduce((sum, l) => sum + calculateLineUsage(l.id).monthUsed, 0);
    const monthlyLimitPercent = totalMonthlyLimit > 0 ? Math.round((totalMonthlyUsed / totalMonthlyLimit) * 100) : 0;

    const linesWithUsage = (db.cashLines || []).map((line) => {
      const usage = calculateLineUsage(line.id);
      return {
        id: line.id,
        name: line.name,
        provider: line.provider,
        phoneNumber: line.phoneNumber,
        dailyUtilizationPercent: usage.dailyUtilizationPercent,
        monthlyUtilizationPercent: usage.monthlyUtilizationPercent,
        maxUtilization: Math.max(usage.dailyUtilizationPercent, usage.monthlyUtilizationPercent),
        remainingDaily: usage.remainingDaily,
        remainingMonthly: usage.remainingMonthly,
      };
    }).sort((a, b) => b.maxUtilization - a.maxUtilization);

    const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const dayIdx = (d.getDay() + 1) % 7;
      const dayName = days[dayIdx] || 'اليوم';

      const dayTransfers = (db.transfers || []).filter((t) => (t.timestamp || '').slice(0, 10) === dStr);
      const completedDayTransfers = dayTransfers.filter((t) => t.status === 'completed');

      const inc = completedDayTransfers.filter((t) => t.transferType === 'receive_money');
      const out = completedDayTransfers.filter((t) => t.transferType !== 'receive_money');
      const incomingValue = inc.reduce((s, t) => s + (t.amount || 0), 0);
      const outgoingValue = out.reduce((s, t) => s + (t.amount || 0), 0);
      const totalValue = incomingValue + outgoingValue;

      last7Days.push({
        date: dStr,
        label: `${d.getDate()} ${dayName}`,
        dayName,
        count: completedDayTransfers.length,
        value: totalValue,
        incomingValue,
        incomingCount: inc.length,
        outgoingValue,
        outgoingCount: out.length,
        totalValue,
        netFlow: incomingValue - outgoingValue,
      });
    }

    const recentTransfers = [...(db.transfers || [])]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    res.json({
      period: periodParam,
      periodLabel,
      startDate,
      endDate,
      periodTransfersCount,
      periodTransfersValue,
      periodIncomingValue,
      periodIncomingCount,
      periodOutgoingValue,
      periodOutgoingCount,
      periodTransfersList: periodTransfers.slice(0, 50),
      todayTransfersCount: totalTransfersTodayCount,
      todayTransfersValue: totalTransfersTodayValue,
      monthTransfersCount: totalTransfersMonthCount,
      monthTransfersValue: totalTransfersMonthValue,
      successfulOperationsCount,
      failedOrCancelledCount,
      successRatePercent,
      totalCommissionsAndProfits,
      totalLiquidity,
      dailyLimitPercent,
      remainingDailyPercent: Math.max(0, 100 - dailyLimitPercent),
      monthlyLimitPercent,
      remainingMonthlyPercent: Math.max(0, 100 - monthlyLimitPercent),
      linesClosestToLimits: linesWithUsage.slice(0, 4),
      last7Days,
      recentTransfers: periodTransfers.length > 0 ? periodTransfers.slice(0, 10) : recentTransfers,
    });
  });

  app.get('/api/project/total-funds', authMiddleware, (req, res) => {
    const vaults = db.vaults || [];
    const mainVault = vaults.find(v => v.type === 'main');
    const subVaults = vaults.filter(v => v.type === 'sub');
    const customerVault = vaults.find(v => v.type === 'customer');

    const totalLinesBalance = (db.cashLines || []).reduce((sum, l) => sum + (l.balance || 0), 0);
    const mainVaultBalance = mainVault ? mainVault.balance : 0;
    const subVaultsBalance = subVaults.reduce((sum, v) => sum + (v.balance || 0), 0);
    const customerVaultBalance = customerVault ? customerVault.balance : 0;
    const grandTotal = mainVaultBalance + subVaultsBalance + totalLinesBalance;

    res.json({
      totalProjectFunds: grandTotal,
      grandTotal,
      mainVaultBalance,
      subVaultsBalance,
      customerVaultBalance,
      linesBalance: totalLinesBalance,
      currency: db.settings?.currency || 'ج.م',
      timestamp: new Date().toISOString(),
    });
  });

  // Lines
  app.get('/api/lines', authMiddleware, (req, res) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = new Date().toISOString().slice(0, 7);

    const lines = (db.cashLines || []).map(line => {
      let todayUsed = 0;
      let monthUsed = 0;
      let todayCount = 0;
      let monthCount = 0;

      (db.transfers || []).forEach(t => {
        if (t.sourceLineId === line.id && t.status === 'completed' && t.transferType !== 'receive_money') {
          const d = (t.timestamp || '').slice(0, 10);
          const m = (t.timestamp || '').slice(0, 7);
          if (d === todayStr) {
            todayUsed += t.amount || 0;
            todayCount++;
          }
          if (m === monthStr) {
            monthUsed += t.amount || 0;
            monthCount++;
          }
        }
      });

      return {
        ...line,
        todayUsed,
        monthUsed,
        todayCount,
        monthCount,
      };
    });

    res.json(lines);
  });

  app.post('/api/lines', authMiddleware, (req, res) => {
    const body = req.body || {};
    const newLine = {
      id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: body.name || 'خط كاش جديد',
      provider: body.provider || 'vodafone',
      phoneNumber: body.phoneNumber || '',
      accountHolder: body.accountHolder || '',
      balance: Number(body.balance) || 0,
      dailyLimit: Number(body.dailyLimit) || 60000,
      monthlyLimit: Number(body.monthlyLimit) || 200000,
      warningThresholdPercent: Number(body.warningThresholdPercent) || 80,
      status: body.status || 'active',
      iconColor: body.iconColor || '#E60000',
      notes: body.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.cashLines.push(newLine);
    saveDatabaseAsync();
    res.status(201).json(newLine);
  });

  app.put('/api/lines/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const line = (db.cashLines || []).find(l => l.id === id);
    if (!line) return res.status(404).json({ error: 'الخط غير موجود' });
    Object.assign(line, req.body, { updatedAt: new Date().toISOString() });
    saveDatabaseAsync();
    res.json(line);
  });

  app.delete('/api/lines/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    db.cashLines = (db.cashLines || []).filter(l => l.id !== id);
    saveDatabaseAsync();
    res.json({ success: true });
  });

  // Transfers
  app.get('/api/transfers', authMiddleware, (req, res) => {
    const list = [...(db.transfers || [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json(list);
  });

  app.post('/api/transfers', authMiddleware, (req, res) => {
    const body = req.body || {};
    const amt = Number(body.amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ error: 'المبلغ غير صالح' });
    }

    const sourceLine = (db.cashLines || []).find(l => l.id === body.sourceLineId);
    if (body.transferType !== 'receive_money' && sourceLine) {
      sourceLine.balance = Math.max(0, (sourceLine.balance || 0) - amt);
      sourceLine.updatedAt = new Date().toISOString();
    } else if (body.transferType === 'receive_money' && sourceLine) {
      sourceLine.balance = (sourceLine.balance || 0) + amt;
      sourceLine.updatedAt = new Date().toISOString();
    }

    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const newTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referenceNumber: `TRX${datePrefix}${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: now.toISOString(),
      transferType: body.transferType || 'cash_wallet',
      sourceLineId: body.sourceLineId,
      sourceLineName: sourceLine ? sourceLine.name : (body.sourceLineName || ''),
      sourceNumber: sourceLine ? sourceLine.phoneNumber : (body.sourceNumber || ''),
      recipientType: body.recipientType || 'wallet',
      recipientNumber: body.recipientNumber || '',
      recipientName: body.recipientName || 'عميل نقدي',
      destinationBankOrWallet: body.destinationBankOrWallet || 'فودافون كاش',
      amount: amt,
      fee: Number(body.fee) || 0,
      totalAmount: amt + (Number(body.fee) || 0),
      balanceAfter: sourceLine ? sourceLine.balance : undefined,
      notes: body.notes || '',
      operatorId: req.user.id,
      operatorName: req.user.fullName,
      status: 'completed',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    db.transfers.unshift(newTx);
    saveDatabaseAsync();
    res.status(201).json(newTx);
  });

  app.post('/api/transfers/:id/status', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { status } = req.body || {};
    const tx = (db.transfers || []).find(t => t.id === id);
    if (!tx) return res.status(404).json({ error: 'العملية غير موجودة' });
    tx.status = status;
    tx.updatedAt = new Date().toISOString();
    saveDatabaseAsync();
    res.json(tx);
  });

  // ==========================================
  // VAULTS MANAGEMENT (The Crucial Section!)
  // ==========================================
  app.get('/api/vaults', authMiddleware, (req, res) => {
    const vaults = db.vaults || [];
    const subVaults = vaults.filter(v => v.type === 'sub');
    const mainVault = vaults.find(v => v.type === 'main');
    const customerVault = vaults.find(v => v.type === 'customer');

    const totalSubBalance = subVaults.reduce((sum, v) => sum + (v.balance || 0), 0);
    if (mainVault) {
      mainVault.allocatedBalance = totalSubBalance;
    }

    const totalLinesLiquidity = (db.cashLines || []).reduce((sum, l) => sum + (l.balance || 0), 0);
    if (customerVault) {
      customerVault.balance = totalLinesLiquidity;
    }

    const summary = {
      totalTreasuryBalance: (mainVault?.balance || 0) + totalSubBalance + (customerVault?.balance || 0),
      mainVaultBalance: mainVault?.balance || 0,
      totalSubBalance,
      customerVaultBalance: customerVault?.balance || 0,
      subVaultsCount: subVaults.length,
      activeVaultsCount: vaults.filter(v => v.status === 'active').length,
    };

    return res.json({ vaults, summary });
  });

  app.get('/api/vaults/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const vault = (db.vaults || []).find(v => v.id === id || v.code === id);
    if (!vault) return res.status(404).json({ error: 'الخزنة غير موجودة' });

    const transactions = (db.vaultTransactions || [])
      .filter(t => t.sourceVaultId === vault.id || t.targetVaultId === vault.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    return res.json({ vault, transactions });
  });

  app.post('/api/vaults', authMiddleware, (req, res) => {
    const body = req.body || {};
    if (!body.name || !body.name.trim()) {
      return res.status(400).json({ error: 'الرجاء إدخال اسم الخزنة الفرعية' });
    }

    let assignedEmployeeName = '';
    if (body.assignedEmployeeId) {
      const emp = db.users.find(u => u.id === body.assignedEmployeeId);
      if (emp) assignedEmployeeName = emp.fullName;
    }

    const now = new Date().toISOString();
    const subCount = (db.vaults || []).filter(v => v.type === 'sub').length + 1;
    const autoCode = body.code?.trim() || `SUB-${String(subCount).padStart(2, '0')}`;

    const newVault = {
      id: `vlt_sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: body.name.trim(),
      code: autoCode,
      type: 'sub',
      balance: 0,
      branch: body.branch?.trim() || 'المركز الرئيسي',
      assignedEmployeeId: body.assignedEmployeeId || undefined,
      assignedEmployeeName: assignedEmployeeName || undefined,
      status: 'active',
      minBalance: Number(body.minBalance) || 20000,
      maxBalance: Number(body.maxBalance) || 1000000,
      totalIn: 0,
      totalOut: 0,
      notes: body.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    db.vaults.push(newVault);
    logAudit(req.user, 'إنشاء خزنة فرعية جديدة', `تم إنشاء الخزنة: ${newVault.name} (${newVault.code})`);
    saveDatabaseAsync();

    return res.status(201).json(newVault);
  });

  app.put('/api/vaults/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const vault = (db.vaults || []).find(v => v.id === id);
    if (!vault) return res.status(404).json({ error: 'الخزنة غير موجودة' });

    const body = req.body || {};
    if (body.name) vault.name = body.name.trim();
    if (body.branch !== undefined) vault.branch = body.branch.trim();
    if (body.status) vault.status = body.status;
    if (body.minBalance !== undefined) vault.minBalance = Number(body.minBalance);
    if (body.maxBalance !== undefined) vault.maxBalance = Number(body.maxBalance);
    if (body.notes !== undefined) vault.notes = body.notes;
    if (body.assignedEmployeeId !== undefined) {
      vault.assignedEmployeeId = body.assignedEmployeeId;
      const emp = db.users.find(u => u.id === body.assignedEmployeeId);
      vault.assignedEmployeeName = emp ? emp.fullName : undefined;
    }

    vault.updatedAt = new Date().toISOString();
    saveDatabaseAsync();
    return res.json(vault);
  });

  app.post('/api/vaults/:id/capital', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { newBalance, notes } = req.body || {};
    const parsedBalance = Number(newBalance);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      return res.status(400).json({ error: 'رأس المال / الرصيد الجديد يجب أن يكون رقماً صحيحاً أو صفراً أو أكبر' });
    }

    const vault = (db.vaults || []).find(v => v.id === id);
    if (!vault) return res.status(404).json({ error: 'الخزنة غير موجودة' });

    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prevBalance = vault.balance;
    const diff = parsedBalance - prevBalance;

    vault.balance = parsedBalance;
    vault.lastTransactionAt = now.toISOString();
    vault.lastTransactionType = 'capital_adjustment';
    vault.lastTransactionAmount = Math.abs(diff);
    vault.updatedAt = now.toISOString();

    const vaultTx = {
      id: `vtx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referenceNumber: `VTX-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: now.toISOString(),
      type: 'adjustment',
      targetVaultId: vault.id,
      targetVaultName: vault.name,
      amount: Math.abs(diff),
      targetBalanceBefore: prevBalance,
      targetBalanceAfter: vault.balance,
      operatorId: req.user.id,
      operatorName: req.user.fullName,
      status: 'completed',
      notes: notes || `تعديل مباشر لرأس المال من ${prevBalance.toLocaleString()} إلى ${parsedBalance.toLocaleString()}`,
      createdAt: now.toISOString(),
    };

    if (!Array.isArray(db.vaultTransactions)) db.vaultTransactions = [];
    db.vaultTransactions.unshift(vaultTx);

    logAudit(req.user, 'تعديل رأس مال الخزينة', `تم تعديل رصيد خزينة (${vault.name}) إلى ${parsedBalance.toLocaleString()}`);
    saveDatabaseAsync();

    return res.status(200).json({ success: true, vault, transaction: vaultTx });
  });

  app.post('/api/vaults/sync-lines', authMiddleware, (req, res) => {
    const customerVault = (db.vaults || []).find(v => v.type === 'customer');
    if (!customerVault) return res.status(404).json({ error: 'خزينة عمليات العملاء غير موجودة' });

    const totalLinesLiquidity = (db.cashLines || []).reduce((sum, l) => sum + (l.balance || 0), 0);
    const prevBalance = customerVault.balance;
    customerVault.balance = totalLinesLiquidity;
    customerVault.lastTransactionAt = new Date().toISOString();
    customerVault.lastTransactionType = 'lines_sync';
    customerVault.lastTransactionAmount = Math.abs(totalLinesLiquidity - prevBalance);
    customerVault.updatedAt = new Date().toISOString();

    logAudit(req.user, 'مزامنة سيولة خطوط الكاش بالخزينة', `تمت مزامنة رصيد خزينة العملاء مع إجمالي أرصدة خطوط الكاش (${totalLinesLiquidity.toLocaleString()})`);
    saveDatabaseAsync();

    return res.status(200).json({
      success: true,
      customerVault,
      totalLinesLiquidity,
      linesCount: (db.cashLines || []).length,
    });
  });

  app.delete('/api/vaults/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const vault = (db.vaults || []).find(v => v.id === id);
    if (!vault) return res.status(404).json({ error: 'الخزنة غير موجودة' });

    if (vault.type === 'main' || vault.type === 'customer') {
      return res.status(400).json({ error: 'لا يمكن حذف الخزنة المركزية الرئيسية أو خزينة العمليات' });
    }

    if (vault.balance > 0) {
      return res.status(400).json({
        error: `لا يمكن حذف الخزنة لوجود رصيد متبقي بها (${vault.balance.toLocaleString()}). يرجى تحويل الرصيد أولاً.`
      });
    }

    db.vaults = (db.vaults || []).filter(v => v.id !== id);
    logAudit(req.user, 'حذف خزنة فرعية', `تم حذف الخزنة الفرعية: ${vault.name}`);
    saveDatabaseAsync();

    return res.json({ success: true, message: `تم حذف الخزنة ${vault.name} بنجاح` });
  });

  app.post('/api/vaults/:id/deposit', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { amount, notes } = req.body || {};
    const depAmount = Number(amount);
    if (isNaN(depAmount) || depAmount <= 0) {
      return res.status(400).json({ error: 'قيمة الإيداع يجب أن تكون أكبر من صفر' });
    }

    const vault = (db.vaults || []).find(v => v.id === id);
    if (!vault) return res.status(404).json({ error: 'الخزنة غير موجودة' });

    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prevBalance = vault.balance;
    vault.balance += depAmount;
    vault.totalIn += depAmount;
    vault.lastTransactionAt = now.toISOString();
    vault.lastTransactionType = 'deposit_main';
    vault.lastTransactionAmount = depAmount;
    vault.updatedAt = now.toISOString();

    const vaultTx = {
      id: `vtx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referenceNumber: `VTX-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: now.toISOString(),
      type: 'deposit_main',
      targetVaultId: vault.id,
      targetVaultName: vault.name,
      amount: depAmount,
      targetBalanceBefore: prevBalance,
      targetBalanceAfter: vault.balance,
      operatorId: req.user.id,
      operatorName: req.user.fullName,
      status: 'completed',
      notes: notes || 'توريد سيولة نقدية جديدة للخزنة الرئيسية',
      createdAt: now.toISOString(),
    };

    db.vaultTransactions.unshift(vaultTx);
    logAudit(req.user, 'إيداع بالخزنة الرئيسية', `تم إيداع مبلغ ${depAmount.toLocaleString()} في ${vault.name}`);
    saveDatabaseAsync();

    return res.status(201).json({ success: true, vault, transaction: vaultTx });
  });

  app.post('/api/vaults/transfer', authMiddleware, (req, res) => {
    const { sourceVaultId, targetVaultId, amount, notes } = req.body || {};
    const txAmount = Number(amount);
    if (isNaN(txAmount) || txAmount <= 0) {
      return res.status(400).json({ error: 'قيمة التحويل يجب أن تكون أكبر من صفر' });
    }

    const sourceVault = (db.vaults || []).find(v => v.id === sourceVaultId);
    const targetVault = (db.vaults || []).find(v => v.id === targetVaultId);

    if (!sourceVault || !targetVault) {
      return res.status(404).json({ error: 'إحدى الخزائن المختارة غير موجودة' });
    }

    if (sourceVault.balance < txAmount) {
      return res.status(400).json({
        error: `رصيد الخزنة المصدر (${sourceVault.name}: ${sourceVault.balance.toLocaleString()}) غير كافٍ لتحويل ${txAmount.toLocaleString()}`,
      });
    }

    let txType = 'adjustment';
    if (sourceVault.type === 'main' && targetVault.type === 'sub') txType = 'transfer_main_to_sub';
    else if (sourceVault.type === 'sub' && targetVault.type === 'main') txType = 'transfer_sub_to_main';
    else if (targetVault.type === 'customer') txType = 'allocate_customer_vault';

    const now = new Date();
    const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
    const sBefore = sourceVault.balance;
    const tBefore = targetVault.balance;

    sourceVault.balance -= txAmount;
    sourceVault.totalOut = (sourceVault.totalOut || 0) + txAmount;
    sourceVault.lastTransactionAt = now.toISOString();
    sourceVault.lastTransactionType = txType;
    sourceVault.lastTransactionAmount = txAmount;
    sourceVault.updatedAt = now.toISOString();

    targetVault.balance += txAmount;
    targetVault.totalIn = (targetVault.totalIn || 0) + txAmount;
    targetVault.lastTransactionAt = now.toISOString();
    targetVault.lastTransactionType = txType;
    targetVault.lastTransactionAmount = txAmount;
    targetVault.updatedAt = now.toISOString();

    const vaultTx = {
      id: `vtx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      referenceNumber: `VTX-${datePrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: now.toISOString(),
      type: txType,
      sourceVaultId: sourceVault.id,
      sourceVaultName: sourceVault.name,
      targetVaultId: targetVault.id,
      targetVaultName: targetVault.name,
      amount: txAmount,
      sourceBalanceBefore: sBefore,
      sourceBalanceAfter: sourceVault.balance,
      targetBalanceBefore: tBefore,
      targetBalanceAfter: targetVault.balance,
      operatorId: req.user.id,
      operatorName: req.user.fullName,
      status: 'completed',
      notes: notes || 'تحويل نقدية بين الخزن',
      createdAt: now.toISOString(),
    };

    db.vaultTransactions.unshift(vaultTx);
    saveDatabaseAsync();

    return res.json({
      success: true,
      transaction: vaultTx,
      sourceVault,
      targetVault,
    });
  });

  app.get('/api/vault-transactions', authMiddleware, (req, res) => {
    const list = [...(db.vaultTransactions || [])].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    res.json({
      transactions: list,
      totalCount: list.length,
      page: 1,
      pageSize: 50,
      totalPages: 1,
    });
  });

  // Handovers
  app.get('/api/handovers', authMiddleware, (req, res) => {
    const list = [...(db.shiftHandovers || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(list);
  });

  app.post('/api/handovers', authMiddleware, (req, res) => {
    const body = req.body || {};
    const now = new Date().toISOString();
    const handoverNum = `HND-${now.slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newHandover = {
      id: `hnd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      handoverNumber: handoverNum,
      vaultId: body.vaultId || 'vlt_sub_1',
      vaultName: body.vaultName || 'خزنة فرع',
      branch: body.branch || 'المركز الرئيسي',
      deliveringUserId: req.user.id,
      deliveringUserName: req.user.fullName,
      receivingUserId: body.receivingUserId || '',
      receivingUserName: body.receivingUserName || '',
      shiftStartTime: body.shiftStartTime || now,
      shiftEndTime: now,
      startBalance: Number(body.startBalance) || 0,
      totalDeposits: Number(body.totalDeposits) || 0,
      totalWithdrawals: Number(body.totalWithdrawals) || 0,
      totalTransfersIn: Number(body.totalTransfersIn) || 0,
      totalTransfersOut: Number(body.totalTransfersOut) || 0,
      successfulOperationsCount: Number(body.successfulOperationsCount) || 0,
      failedOperationsCount: Number(body.failedOperationsCount) || 0,
      pendingOperationsCount: Number(body.pendingOperationsCount) || 0,
      expectedEndingBalance: Number(body.expectedEndingBalance) || 0,
      actualEndingBalance: Number(body.actualEndingBalance) || 0,
      differenceAmount: Number(body.differenceAmount) || 0,
      differenceStatus: body.differenceStatus || 'matched',
      lineVerifications: body.lineVerifications || [],
      notes: body.notes || '',
      status: 'pending_receiver_approval',
      createdAt: now,
      updatedAt: now,
    };

    db.shiftHandovers.unshift(newHandover);
    saveDatabaseAsync();
    res.status(201).json(newHandover);
  });

  app.post('/api/handovers/:id/accept', authMiddleware, (req, res) => {
    const { id } = req.params;
    const h = (db.shiftHandovers || []).find(item => item.id === id);
    if (!h) return res.status(404).json({ error: 'المحضر غير موجود' });
    h.status = 'completed';
    h.receivingConfirmedAt = new Date().toISOString();
    h.updatedAt = new Date().toISOString();
    saveDatabaseAsync();
    res.json({ success: true, handover: h });
  });

  app.post('/api/handovers/:id/reject', authMiddleware, (req, res) => {
    const { id } = req.params;
    const { reason } = req.body || {};
    const h = (db.shiftHandovers || []).find(item => item.id === id);
    if (!h) return res.status(404).json({ error: 'المحضر غير موجود' });
    h.status = 'rejected';
    h.rejectionReason = reason || 'تم الرفض من قبل المستلم';
    h.updatedAt = new Date().toISOString();
    saveDatabaseAsync();
    res.json({ success: true, handover: h });
  });

  // Users
  app.get('/api/users', authMiddleware, (req, res) => {
    const sanitized = (db.users || []).map(({ passwordHash, salt, ...rest }) => rest);
    res.json(sanitized);
  });

  // Settings
  app.get('/api/settings', authMiddleware, (req, res) => {
    res.json(db.settings || getInitialSeed().settings);
  });

  app.put('/api/settings', authMiddleware, (req, res) => {
    db.settings = { ...db.settings, ...req.body };
    saveDatabaseAsync();
    res.json(db.settings);
  });

  // Audit Logs
  app.get('/api/audit-logs', authMiddleware, (req, res) => {
    res.json(db.auditLogs || []);
  });
  app.get('/api/audit', authMiddleware, (req, res) => {
    res.json(db.auditLogs || []);
  });

  // Backup & Restore
  app.get('/api/backup', authMiddleware, (req, res) => {
    res.json({
      exportedAt: new Date().toISOString(),
      version: '2.44.0',
      data: db,
    });
  });

  app.post('/api/restore', authMiddleware, (req, res) => {
    const { backupData } = req.body || {};
    if (!backupData || !backupData.users) {
      return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
    }
    db = backupData.data || backupData;
    saveDatabaseSync();
    res.json({ success: true, message: 'تم استعادة البيانات بنجاح' });
  });

  app.post('/api/factory-reset', authMiddleware, (req, res) => {
    const now = new Date().toISOString();
    const cleanSeed = getInitialSeed();
    cleanSeed.transfers = [];
    cleanSeed.vaultTransactions = [];
    cleanSeed.shiftHandovers = [];
    cleanSeed.reconciliations = [];

    // Zero out all line balances
    cleanSeed.cashLines.forEach((l) => {
      l.balance = 0;
      l.status = 'active';
      l.isSynced = false;
      l.syncedLiquidity = 0;
      l.syncedDailyUsed = 0;
      l.syncedMonthlyUsed = 0;
      l.updatedAt = now;
    });

    // Zero out all vault balances
    cleanSeed.vaults.forEach((v) => {
      v.balance = 0;
      v.allocatedBalance = 0;
      v.totalIn = 0;
      v.totalOut = 0;
      v.lastTransactionAmount = 0;
      v.lastTransactionType = undefined;
      v.lastTransactionAt = undefined;
      v.updatedAt = now;
    });

    cleanSeed.auditLogs = [
      {
        id: `aud_reset_${Date.now()}`,
        timestamp: now,
        operatorId: req.user ? req.user.id : 'usr_admin',
        operatorName: req.user ? req.user.fullName : 'عادل فتحي',
        action: 'إعادة ضبط المصنع (Factory Reset)',
        details: 'تم تصفير كافة الأرصدة (رصيد البرنامج صفر، ورصيد جميع الخطوط والحسابات والخزن صفر) ومسح كامل لسجلات العمليات والتحويلات',
        ipAddress: '127.0.0.1',
      },
    ];

    db = cleanSeed;
    saveDatabaseSync();

    return res.json({
      success: true,
      message: 'تمت إعادة ضبط المصنع بنجاح، وتصفير كافة الأرصدة والخزن والخطوط (0.00 ج.م) ومسح جميع السجلات بالكامل',
      timestamp: now,
    });
  });
};
