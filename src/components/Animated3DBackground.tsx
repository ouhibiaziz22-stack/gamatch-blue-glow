import { motion } from "framer-motion";

const Animated3DBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base dark gradient */}
      <div className="absolute inset-0 gamatch-hero-bg" />

      {/* Animated grid */}
      <div
        className="absolute inset-0 animate-grid-pulse"
        style={{
          backgroundImage: `
            linear-gradient(hsl(48 100% 50% / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, hsl(48 100% 50% / 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Large rotating ring */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full border border-primary/5" />
      </motion.div>

      <motion.div
        className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-full h-full rounded-full border border-primary/8 border-dashed" />
      </motion.div>

      {/* Glowing orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full blur-[150px]"
        style={{ background: "hsl(48 100% 50% / 0.06)" }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        initial={{ top: "20%", left: "10%" }}
      />
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-[120px]"
        style={{ background: "hsl(36 100% 55% / 0.05)" }}
        animate={{
          x: [0, -70, 80, 0],
          y: [0, 60, -40, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        initial={{ top: "60%", right: "15%" }}
      />

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
          style={{
            left: `${10 + (i * 7) % 80}%`,
            top: `${15 + (i * 11) % 70}%`,
          }}
          animate={{
            y: [0, -30 - (i * 5), 10, 0],
            x: [0, 10 + (i * 3), -15, 0],
            opacity: [0.2, 0.7, 0.3, 0.2],
            scale: [1, 1.5, 0.8, 1],
          }}
          transition={{
            duration: 6 + i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Diagonal light streak */}
      <motion.div
        className="absolute w-[1px] h-[200vh] origin-center"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(48 100% 50% / 0.1), transparent)",
          left: "30%",
          top: "-50%",
          transform: "rotate(25deg)",
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[1px] h-[200vh] origin-center"
        style={{
          background: "linear-gradient(to bottom, transparent, hsl(42 100% 45% / 0.08), transparent)",
          left: "70%",
          top: "-50%",
          transform: "rotate(-20deg)",
        }}
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
    </div>
  );
};

export default Animated3DBackground;
