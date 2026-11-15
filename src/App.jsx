import React, { useState, useEffect } from 'react';

export default function App() {
  // 1. 從 localStorage 讀取初始資料，若沒有則使用預設值
  const [jpyRate, setJpyRate] = useState(() => {
    const saved = localStorage.getItem('trip_jpyRate');
    return saved !== null ? parseFloat(saved) : 0.21;
  });

  const [usdRate, setUsdRate] = useState(() => {
    const saved = localStorage.getItem('trip_usdRate');
    return saved !== null ? parseFloat(saved) : 32.5;
  });

  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('trip_members');
    return saved ? JSON.parse(saved) : ['賢', '哲', '媽', '媃'];
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('trip_expenses');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: '門票', currency: 'JPY', amount: 5000, paidBy: '賢', splitAmong: ['賢', '哲', '媽', '媃'] },
      { id: 2, title: '晚餐', currency: 'TWD', amount: 2000, paidBy: '哲', splitAmong: ['賢', '哲', '媽', '媃'] }
    ];
  });

  const [newMemberName, setNewMemberName] = useState('');

  // 新增消費表單狀態
  const [title, setTitle] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('賢');
  const [splitAmong, setSplitAmong] = useState(['賢', '哲', '媽', '媃']);

  // 當資料改變時，自動同步儲存到 localStorage
  useEffect(() => {
    localStorage.setItem('trip_jpyRate', jpyRate);
  }, [jpyRate]);

  useEffect(() => {
    localStorage.setItem('trip_usdRate', usdRate);
  }, [usdRate]);

  useEffect(() => {
    localStorage.setItem('trip_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('trip_expenses', JSON.stringify(expenses));
  }, [expenses]);

  // 新增夥伴
  const addMember = () => {
    if (!newMemberName.trim()) return;
    if (members.includes(newMemberName.trim())) {
      alert('這位夥伴已經存在囉！');
      return;
    }
    const updatedMembers = [...members, newMemberName.trim()];
    setMembers(updatedMembers);
    setNewMemberName('');
  };

  // 刪除夥伴
  const removeMember = (memberToRemove) => {
    if (members.length <= 1) {
      alert('至少需要保留一位夥伴！');
      return;
    }
    setMembers(members.filter(m => m !== memberToRemove));
  };

  // 切換分擔勾選
  const toggleSplitMember = (member) => {
    if (splitAmong.includes(member)) {
      if (splitAmong.length === 1) {
        alert('分帳人數至少要有一人！');
        return;
      }
      setSplitAmong(splitAmong.filter(m => m !== member));
    } else {
      setSplitAmong([...splitAmong, member]);
    }
  };

  // 新增消費項目
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount || isNaN(amount)) {
      alert('請填寫完整的消費項目與正確金額！');
      return;
    }

    const newExpense = {
      id: Date.now(),
      title: title.trim(),
      currency,
      amount: parseFloat(amount),
      paidBy,
      splitAmong: [...splitAmong]
    };

    setExpenses([newExpense, ...expenses]);
    setTitle('');
    setAmount('');
  };

  // 刪除消費項目
  const deleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  // 換算成 TWD 的金額
  const convertToTWD = (curr, amt) => {
    if (curr === 'JPY') return amt * jpyRate;
    if (curr === 'USD') return amt * usdRate;
    return amt; // TWD
  };

  // 3. 計算總花費與結算
  let totalTWD = 0;
  const paidMap = {}; 
  const shouldPayMap = {}; 

  members.forEach(m => {
    paidMap[m] = 0;
    shouldPayMap[m] = 0;
  });

  expenses.forEach(exp => {
    const costInTWD = convertToTWD(exp.currency, exp.amount);
    totalTWD += costInTWD;

    if (paidMap[exp.paidBy] !== undefined) {
      paidMap[exp.paidBy] += costInTWD;
    }

    const splitCount = exp.splitAmong.length;
    if (splitCount > 0) {
      const perPerson = costInTWD / splitCount;
      exp.splitAmong.forEach(m => {
        if (shouldPayMap[m] !== undefined) {
          shouldPayMap[m] += perPerson;
        }
      });
    }
  });

  const balanceMap = {};
  members.forEach(m => {
    balanceMap[m] = paidMap[m] - shouldPayMap[m];
  });

  const debtors = []; 
  const creditors = []; 

  members.forEach(m => {
    const bal = balanceMap[m];
    if (bal < -0.01) debtors.push({ name: m, amount: -bal });
    if (bal > 0.01) creditors.push({ name: m, amount: bal });
  });

  const settlements = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];
    const settledAmount = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: Math.round(settledAmount)
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < 0.01) dIdx++;
    if (creditor.amount < 0.01) cIdx++;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>✨ 多幣別旅遊分帳小幫手 ✨</h2>

      {/* 1. 匯率與夥伴設定 */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>1. 匯率與夥伴設定</h3>
        <div style={styles.row}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>日圓匯率 (1 JPY = ? TWD)</label>
            <input 
              type="number" 
              step="0.001" 
              value={jpyRate} 
              onChange={(e) => setJpyRate(parseFloat(e.target.value) || 0)} 
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>美金匯率 (1 USD = ? TWD)</label>
            <input 
              type="number" 
              step="0.1" 
              value={usdRate} 
              onChange={(e) => setUsdRate(parseFloat(e.target.value) || 0)} 
              style={styles.input}
            />
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <label style={styles.label}>夥伴名單 ({members.length} 人)</label>
          <div style={styles.badgeContainer}>
            {members.map(m => (
              <span key={m} style={styles.badge}>
                {m}
                {members.length > 1 && (
                  <button onClick={() => removeMember(m)} style={styles.removeBadgeBtn}>×</button>
                )}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <input 
              type="text" 
              placeholder="輸入新夥伴名字..." 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              style={styles.input}
            />
            <button onClick={addMember} style={styles.secondaryBtn}>+ 新增夥伴</button>
          </div>
        </div>
      </section>

      {/* 2. 新增消費紀錄 */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>2. 新增消費紀錄</h3>
        <form onSubmit={handleAddExpense}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>消費項目</label>
            <input 
              type="text" 
              placeholder="例如：門票、晚餐、計程車" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>幣別</label>
              <select 
                value={currency} 
                onChange={(e) => setCurrency(e.target.value)}
                style={styles.select}
              >
                <option value="JPY" style={styles.option}>🇯🇵 日圓 (JPY)</option>
                <option value="USD" style={styles.option}>🇺🇸 美金 (USD)</option>
                <option value="TWD" style={styles.option}>🇹🇼 台幣 (TWD)</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>金額 ({currency})</label>
              <input 
                type="number" 
                placeholder="輸入金額" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>誰先墊付？</label>
              <select 
                value={paidBy} 
                onChange={(e) => setPaidBy(e.target.value)}
                style={styles.select}
              >
                {members.map(m => (
                  <option key={m} value={m} style={styles.option}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>分擔成員 (預設全選)</label>
            <div style={styles.checkboxContainer}>
              {members.map(m => (
                <label key={m} style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={splitAmong.includes(m)}
                    onChange={() => toggleSplitMember(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" style={styles.primaryBtn}>新增消費</button>
        </form>
      </section>

      {/* 3. 結算總覽 */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>3. 結算總覽 (換算台幣 TWD)</h3>
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <span style={styles.cardTitle}>總花費 (台幣)</span>
            <span style={styles.cardValue}>NT$ {Math.round(totalTWD).toLocaleString()}</span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.cardTitle}>每人平均 (參考)</span>
            <span style={styles.cardValue}>
              NT$ {members.length > 0 ? Math.round(totalTWD / members.length).toLocaleString() : 0}
            </span>
          </div>
        </div>

        <h4 style={styles.subTitle}>💸 建議還款方式 (最少轉帳次數)</h4>
        {settlements.length === 0 ? (
          <p style={styles.textMuted}>目前帳目已平衡，或尚無消費紀錄。</p>
        ) : (
          <ul style={styles.settleList}>
            {settlements.map((s, idx) => (
              <li key={idx} style={styles.settleItem}>
                <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>{s.from}</span> 轉帳給 <span style={{ fontWeight: 'bold', color: '#27ae60' }}>{s.to}</span>
                <span style={styles.settleAmount}>NT$ {s.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. 消費紀錄列表 */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>4. 消費紀錄明細 ({expenses.length} 筆)</h3>
        {expenses.length === 0 ? (
          <p style={styles.textMuted}>尚未新增任何消費。</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {expenses.map(exp => (
              <div key={exp.id} style={styles.expenseCard}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{exp.title}</div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                    付款人: <span style={{ color: '#2980b9', fontWeight: 'bold' }}>{exp.paidBy}</span> | 
                    分擔: {exp.splitAmong.join(', ')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#c0392b' }}>
                      {exp.currency} {exp.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      ≈ NT$ {Math.round(convertToTWD(exp.currency, exp.amount)).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => deleteExpense(exp.id)} style={styles.deleteBtn}>刪除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// 樣式設定
const styles = {
  container: {
    maxWidth: '650px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  header: {
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: '24px'
  },
  section: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    color: '#34495e',
    borderBottom: '2px solid #ecf0f1',
    paddingBottom: '8px'
  },
  subTitle: {
    fontSize: '15px',
    color: '#2c3e50',
    marginTop: '15px',
    marginBottom: '10px'
  },
  row: {
    display: 'flex',
    gap: '15px',
    marginBottom: '12px'
  },
  inputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '12px'
  },
  label: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: '6px'
  },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#000'
  },
  select: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#000000',
    cursor: 'pointer'
  },
  option: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '8px'
  },
  badgeContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  badge: {
    backgroundColor: '#e8f4fd',
    color: '#2980b9',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #d0e8fc'
  },
  removeBadgeBtn: {
    background: 'none',
    border: 'none',
    color: '#2980b9',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '0 2px'
  },
  checkboxContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginTop: '5px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#333'
  },
  primaryBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3498db',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  secondaryBtn: {
    padding: '10px 16px',
    backgroundColor: '#2ecc71',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  summaryGrid: {
    display: 'flex',
    gap: '15px'
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e9ecef'
  },
  cardTitle: {
    display: 'block',
    fontSize: '12px',
    color: '#7f8c8d',
    marginBottom: '6px'
  },
  cardValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  settleList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  settleItem: {
    padding: '10px 12px',
    backgroundColor: '#fdfefe',
    border: '1px solid #eaecee',
    borderRadius: '6px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px'
  },
  settleAmount: {
    fontWeight: 'bold',
    color: '#d35400'
  },
  expenseCard: {
    padding: '12px 15px',
    backgroundColor: '#fdfefe',
    border: '1px solid #eaecee',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  deleteBtn: {
    padding: '6px 10px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  textMuted: {
    color: '#95a5a6',
    fontSize: '14px',
    fontStyle: 'italic'
  }
};