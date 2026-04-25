import { useState, useEffect } from 'react';
import { Users, ArrowLeft, Eye } from 'lucide-react';
import './VisitsPage.css';

function VisitsPage({ onBack }) {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('https://abacus.jasoncameron.dev/get/ai-gym-bro-web/visits');
        const data = await res.json();
        if (data && data.value != null) {
          setCount(data.value);
        }
      } catch (err) {
        console.warn('Failed to fetch visitor count:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCount();
  }, []);

  return (
    <div className="visits">
      <div className="visits__card">
        <button className="visits__back" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="visits__icon">
          <Eye size={32} />
        </div>

        <h1 className="visits__title">
          AI GYM<span className="visits__accent">⚡</span>BRO
        </h1>
        <p className="visits__subtitle">Secret Analytics</p>

        <div className="visits__stat">
          <Users size={20} />
          <span className="visits__label">Total Visitors</span>
          <span className="visits__count">
            {loading ? '...' : count !== null ? count.toLocaleString() : 'N/A'}
          </span>
        </div>

        <p className="visits__note">
          This page is only accessible via <code>/visits</code>
        </p>
      </div>
    </div>
  );
}

export default VisitsPage;
