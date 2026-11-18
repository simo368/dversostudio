import Experience from "@/components/Experience";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import SiteHeader from "@/components/SiteHeader";
import Testimonials from "@/components/Testimonials";

const projects = [
  { number: "01", name: "Maison Noire", category: "Brand Identity · Beauty", image: "photo-1608571423902-eed4a5ad8108", alt: "Minimal beauty bottles and neutral cosmetic packaging" },
  { number: "02", name: "Forme Studio", category: "Art Direction · Campaign", image: "photo-1539109136881-3be0616acf4b", alt: "Fashion editorial portrait in sculptural styling" },
  { number: "03", name: "Aurelia Objects", category: "Packaging · Digital", image: "photo-1602143407151-7111542de6e8", alt: "Sculptural glass and product still life" },
  { number: "04", name: "Atelier 09", category: "Editorial · Visual Identity", image: "photo-1513364776144-60967b0f800f", alt: "Artistic studio workspace and printed matter" },
];

const services = [
  ["01", "Brand Strategy", "Positioning, naming and a foundation built to last."],
  ["02", "Brand Voice Development", "A distinct tone, language system and point of view."],
  ["03", "Visual Identity Design", "Identity systems with clarity, character and consistency."],
  ["04", "Website Design & Development", "Editorial digital experiences, designed and built with intent."],
  ["05", "Social Media Management", "A considered social presence with a recognisable visual rhythm."],
  ["06", "Creative Direction", "A clear creative vision from first idea to final frame."],
  ["07", "Digital Experiences", "Thoughtful digital touchpoints that make brands memorable."],
];

const editorialImages = {
  hero: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2400&q=90",
  socialOne: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
  socialTwo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
  socialThree: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
  cta: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1400&q=90",
};

function Arrow() {
  return <span className="arrow-circle" aria-hidden="true">↗</span>;
}

function SectionLabel({ children, number }: { children: React.ReactNode; number: string }) {
  return <div className="section-label"><span>{number} /</span><span>{children}</span><i className="label-line" aria-hidden="true" /></div>;
}

export default function Home() {
  return (
    <main>
      <Preloader />
      <Cursor />
      <Experience />
      <SiteHeader />

      <section className="hero" id="top">
        <div className="hero-image" style={{ backgroundImage: `url(${editorialImages.hero})` }} />
        <div className="hero-shade" />
        <div className="hero-content">
          <p className="hero-kicker serif-italic">Independent creative &amp; digital agency</p>
          <h1 className="hero-title">
            <span className="hero-title-line">Creative</span>
            <span className="hero-title-line title-second">Agency<span className="title-period">.</span></span>
          </h1>
          <div className="hero-meta"><span>STRATEGY — IDENTITY — DIGITAL</span><span>SCROLL TO EXPLORE ↓</span></div>
        </div>
        <div className="hero-index">EST. MMXXIV <span>·</span> MADE WITH INTENTION</div>
        <div className="scroll-cue" aria-hidden="true"><span /></div>
      </section>

      <section className="statement section-pad" id="about">
        <SectionLabel number="01">A DIFFERENT PERSPECTIVE</SectionLabel>
        <div className="statement-inner">
          <p className="eyebrow serif-italic" data-reveal-lines>Good brands are felt, not just seen.</p>
          <h2 className="statement-title" data-reveal-words>We’ll help you define<br />your <em>unique</em> brand voice<span>.</span></h2>
          <p className="statement-copy" data-scrub-words>We bring strategy, identity and digital craft together to create brands with a point of view. Thoughtful by nature. Distinct by design.</p>
          <a className="text-link" href="#contact" data-reveal-wipe>LEARN MORE <Arrow /></a>
        </div>
        <div className="statement-foot"><span>01 — 08</span><span>CLARITY IS A CREATIVE ADVANTAGE</span></div>
      </section>

      <section className="social-section section-pad">
        <SectionLabel number="02">A WORLD IN MOTION</SectionLabel>
        <div className="social-heading">
          <h2 data-reveal-lines>A consistent voice.<br /><em>Everywhere.</em></h2>
          <p data-reveal-lines>We translate your identity into a social presence that feels unmistakably yours.</p>
        </div>
        <div className="social-stage">
          <div className="social-note note-left">SOCIAL<br />DIRECTION <span>↘</span></div>
          <article className="phone phone-left" data-cursor="view" data-cursor-label="VIEW">
            <div className="phone-top"><span>9:41</span><span>●●●</span></div>
            <div className="insta-top"><b>atelier.forme</b><span>•••</span></div>
            <div className="phone-media"><img src={editorialImages.socialOne} alt="Fashion editorial campaign for Atelier Forme" loading="lazy" decoding="async" /></div>
            <div className="insta-icons"><i>♡</i>　◎　↗ <span>♧</span></div>
            <p className="insta-caption"><b>atelier.forme</b> The art of the everyday.</p>
            <small>VIEW ALL 28 COMMENTS</small>
          </article>
          <article className="phone phone-center" data-cursor="view" data-cursor-label="VIEW">
            <div className="phone-top"><span>9:41</span><span>●●●</span></div>
            <div className="insta-top"><b>maison.noire</b><span>•••</span></div>
            <div className="phone-media"><img src={editorialImages.socialTwo} alt="Portrait for Maison Noire beauty brand social feed" loading="lazy" decoding="async" /></div>
            <div className="insta-icons"><i>♡</i>　◎　↗ <span>♧</span></div>
            <p className="insta-caption"><b>maison.noire</b> Form, feeling, freedom.</p>
            <small>VIEW ALL 42 COMMENTS</small>
          </article>
          <article className="phone phone-right" data-cursor="view" data-cursor-label="VIEW">
            <div className="phone-top"><span>9:41</span><span>●●●</span></div>
            <div className="insta-top"><b>aurelia.objects</b><span>•••</span></div>
            <div className="phone-media"><img src={editorialImages.socialThree} alt="Editorial portrait for Aurelia Objects" loading="lazy" decoding="async" /></div>
            <div className="insta-icons"><i>♡</i>　◎　↗ <span>♧</span></div>
            <p className="insta-caption"><b>aurelia.objects</b> Objects with a story.</p>
            <small>VIEW ALL 16 COMMENTS</small>
          </article>
          <div className="social-note note-right">CURATED<br />WITH PURPOSE <span>↙</span></div>
        </div>
        <div className="social-bottom"><span>ART DIRECTION / CONTENT / COMMUNITY</span><span>SCROLL TO DISCOVER</span></div>
      </section>

      <section className="portfolio-section" id="work">
        <div className="section-pad portfolio-intro">
          <SectionLabel number="03">SELECTED WORLDS</SectionLabel>
          <div className="portfolio-heading">
            <h2 data-reveal-lines>Selected <em>work</em></h2>
            <p data-reveal-lines>A collection of identities and experiences shaped by curiosity, intention and a little irreverence.</p>
          </div>
        </div>
        <div className="project-viewport">
          <div className="project-grid">
            {projects.map((project, index) => (
              <article className={`project project-${index + 1}`} key={project.number} data-cursor="view" data-cursor-label="VIEW PROJECT">
                <div className="project-image">
                  <img src={`https://images.unsplash.com/${project.image}?auto=format&fit=crop&w=1400&q=88`} alt={project.alt} loading="lazy" decoding="async" />
                  <span className="project-overlay" aria-hidden="true"><span>VIEW PROJECT</span></span>
                  <span className="project-number">{project.number}</span>
                </div>
                <div className="project-info"><div><h3>{project.name}</h3><p>{project.category}</p></div><a href="#contact" aria-label={`Discuss a project like ${project.name}`}><Arrow /></a></div>
              </article>
            ))}
          </div>
          <div className="project-progress" aria-hidden="true">
            <span className="project-count">01 / 04</span>
            <span className="project-progress-track"><span className="project-progress-bar" /></span>
            <span className="project-hint"><span>KEEP SCROLLING →</span></span>
          </div>
        </div>
        <div className="portfolio-foot section-pad"><span>MORE STORIES IN THE MAKING</span><span>DVERSO STUDIO ©</span></div>
      </section>

      <section className="services-section section-pad" id="services">
        <SectionLabel number="04">OUR EXPERTISE</SectionLabel>
        <div className="services-heading"><h2 data-reveal-lines>What <em>we do</em></h2><p data-reveal-lines>From the first thought to the final pixel, we create the conditions for brands to mean more.</p></div>
        <div className="service-list">
          {services.map(([number, name, description]) => (
            <a className="service-row" href="#contact" key={number}>
              <span className="service-line" aria-hidden="true" />
              <span className="service-number">{number}</span>
              <span className="service-name">{name}</span>
              <span className="service-description">{description}</span>
              <span className="service-arrow">↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="testimonial-section section-pad">
        <SectionLabel number="05">WORDS THAT MATTER</SectionLabel>
        <h2 data-reveal-lines>What our clients <em>say</em></h2>
        <Testimonials />
      </section>

      <section className="cta-section section-pad">
        <div className="cta-image image-reveal" data-cursor="view" data-cursor-label="VIEW"><img src={editorialImages.cta} alt="Minimal still life in a warm creative studio" loading="lazy" decoding="async" /></div>
        <div className="cta-copy">
          <p className="eyebrow serif-italic" data-reveal-lines>The beginning of something distinct</p>
          <h2 data-cta-heading>Ready to<br /><em>get started?</em></h2>
          <p data-reveal-lines>Have a good idea, a big ambition or a brand ready for its next chapter? We would love to hear about it.</p>
          <a className="cta-button" href="#contact" data-magnetic>
            <span className="cta-button-fill" aria-hidden="true" />
            <span className="cta-button-inner" data-magnetic-inner>
              <span className="roll" data-text="START A PROJECT"><span>START A PROJECT</span></span>
              <Arrow />
            </span>
          </a>
        </div>
      </section>

      <section className="contact-section section-pad" id="contact">
        <SectionLabel number="06">LET’S MAKE IT MATTER</SectionLabel>
        <div className="contact-heading"><h2 data-reveal-lines>Tell us what<br /><em>you have in mind.</em></h2><p data-reveal-lines>A few details are all we need to start a conversation.</p></div>
        <form className="contact-form" action="mailto:hello@dversostudio.com" method="post" encType="text/plain">
          <label><span>01 / FIRST NAME</span><input name="firstName" type="text" autoComplete="given-name" enterKeyHint="next" placeholder="Your first name" required /></label>
          <label><span>02 / LAST NAME</span><input name="lastName" type="text" autoComplete="family-name" enterKeyHint="next" placeholder="Your last name" required /></label>
          <label><span>03 / EMAIL ADDRESS</span><input name="email" type="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" enterKeyHint="next" placeholder="name@email.com" required /></label>
          <label><span>04 / COMPANY</span><input name="company" type="text" autoComplete="organization" enterKeyHint="next" placeholder="Your company" /></label>
          <label className="full-field"><span>05 / PROJECT TYPE</span><select name="projectType" defaultValue=""><option value="" disabled>Select a service</option><option>Brand strategy &amp; identity</option><option>Website design &amp; development</option><option>Social media &amp; content</option><option>Creative direction</option><option>Something else</option></select></label>
          <label className="full-field"><span>06 / TELL US ABOUT IT</span><textarea name="message" rows={3} enterKeyHint="send" placeholder="A little about your project, your goals and your timeline..." required /></label>
          <div className="form-bottom"><p>By sending this form, you agree to be contacted about your enquiry.</p><button type="submit" data-magnetic data-magnetic-strength="0.25"><span className="btn-fill" aria-hidden="true" /><span className="btn-inner" data-magnetic-inner>SEND ENQUIRY <Arrow /></span></button></div>
        </form>
      </section>

      <footer className="site-footer">
        <div className="footer-top"><a className="footer-logo" href="#top">DVERSO<span>STUDIO</span></a><p data-reveal-lines>Independent by nature.<br /><em>Distinct by design.</em></p><a className="back-top roll-link" href="#top"><span className="roll" data-text="BACK TO TOP ↑"><span>BACK TO TOP ↑</span></span></a></div>
        <div className="footer-bottom"><span>© 2026 DVERSO STUDIO. ALL RIGHTS RESERVED.</span><div><a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="u-link">INSTAGRAM ↗</a><a href="mailto:hello@dversostudio.com" className="u-link">HELLO@DVERSOSTUDIO.COM ↗</a></div><span>ITALY — WORKING EVERYWHERE</span></div>
      </footer>
    </main>
  );
}
