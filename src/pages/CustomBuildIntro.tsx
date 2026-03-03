import React from "react";
import { Link } from "react-router-dom";

function CustomBuildIntro() {
  return (
    <section className="custom-intro-page">
      <div className="custom-intro-bg" aria-hidden="true" />
      <div className="custom-intro-overlay">
        <p className="custom-intro-tag">Custom Build</p>
        <h1>Design Your Ultimate Gaming Machine</h1>
        <p>
          Choose your power, style, and performance. Start the pro builder and
          create your world.
        </p>

        <Link to="/custom-build/builder" className="custom-intro-btn">
          Let&apos;s Go Build Your World
        </Link>
      </div>
    </section>
  );
}

export default CustomBuildIntro;
