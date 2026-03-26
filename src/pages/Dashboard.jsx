import StatsCards from '../components/StatsCards';
import InsightsPanel from '../components/InsightsPanel';

const Dashboard = ({ stats, insights }) => {
  return (
    <div className="space-y-5">
      <StatsCards stats={stats} />
      <InsightsPanel insights={insights} />
    </div>
  );
};

export default Dashboard;
