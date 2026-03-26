import { motion } from 'framer-motion';

const StatsCards = ({ stats }) => {
  const cards = [
    { label: 'Total Matched Invoices', value: stats.matched },
    { label: 'Books Not in 2B', value: stats.booksNotIn2B },
    { label: '2B Not in Books', value: stats.twoBNotInBooks },
    { label: 'Total Processed Invoices', value: stats.totalProcessed }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <motion.article
          key={card.label}
          whileHover={{ y: -5, scale: 1.01 }}
          className="rounded-2xl bg-white p-5 shadow-card"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{card.value}</p>
        </motion.article>
      ))}
    </section>
  );
};

export default StatsCards;
