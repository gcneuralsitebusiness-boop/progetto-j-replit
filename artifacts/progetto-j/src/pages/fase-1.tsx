import { Link } from "wouter";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Reveal } from "@/components/Reveal";
import { FASE1_DATA, type Stat } from "@/data/fase1";

const CSS = `
.f1{background:#0A0A0A;color:#E8E4DE;min-height:100dvh;font-family:'Inter',sans-serif;overflow-x:hidden}
.f1 *{border-radius:0;box-shadow:none}
.f1-wrap{max-width:1200px;margin:0 auto;padding:96px 20px 64px}
.f1-label{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.15em;font-size:13px;color:#C9C4BD;margin:0}
.f1-title{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:clamp(56px,11vw,144px);line-height:.9;margin:20px 0 28px;letter-spacing:.01em;overflow-wrap:anywhere}
.f1-intro{font-size:clamp(17px,2vw,21px);line-height:1.55;max-width:42ch;margin:0;color:#E8E4DE}
.f1-sec{margin-top:96px;border-top:1px solid #1A1A1A;padding-top:28px}
.f1-h2{font-family:'Bebas Neue',sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:.04em;font-size:clamp(30px,4vw,48px);line-height:1.1;margin:0 0 8px;color:#E8E4DE}
.f1-grid{display:grid;grid-template-columns:1fr;border-top:1px solid #1A1A1A;margin-top:20px}
.f1-stat{padding:36px 0;border-bottom:1px solid #1A1A1A;min-width:0}
.f1-num{display:block;font-family:'Bebas Neue',sans-serif;font-size:clamp(64px,12vw,120px);line-height:.9;letter-spacing:.01em;white-space:nowrap;overflow-wrap:normal}
.f1-num.wide{font-size:clamp(64px,12vw,120px)}
.f1-num .measured{font-family:inherit;font-size:inherit;line-height:inherit;letter-spacing:inherit}
.f1-stat .f1-label{margin-top:14px;color:#E8E4DE}
.f1-note{font-size:15px;line-height:1.55;color:#C9C4BD;margin:12px 0 0;max-width:44ch}
.f1-red .f1-num{color:#B81D1D}
.f1-red .f1-label{color:#B81D1D}
.f1-tl{list-style:none;margin:20px 0 0;padding:0;display:grid;grid-template-columns:1fr;border-top:1px solid #1A1A1A}
.f1-tl li{padding:32px 0 32px 28px;border-bottom:1px solid #1A1A1A;border-left:1px solid #E8E4DE;position:relative}
.f1-tl li::before{content:"";position:absolute;left:-5px;top:40px;width:9px;height:9px;background:#E8E4DE}
.f1-unit{font-size:.45em;margin-left:.15em;color:#C9C4BD}
.f1-tl-note{font-size:clamp(17px,2vw,20px);line-height:1.55;color:#C9C4BD;margin:28px 0 0;max-width:46ch}
.f1-close{margin-top:120px;border-top:1px solid #1A1A1A;padding-top:64px}
.f1-quote{margin:0;max-width:24ch}
.f1-quote p{font-style:italic;font-size:clamp(26px,4.4vw,52px);line-height:1.2;margin:0;font-weight:400}
.f1-quote figcaption{margin-top:20px}
.f1-again{font-size:clamp(17px,2vw,21px);line-height:1.55;margin:56px 0 0}
.f1-nika{font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,8vw,96px);text-align:center;margin:96px 0 0;letter-spacing:.12em}
.f1-back{display:inline-block;font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.15em;font-size:13px;color:#E8E4DE;text-decoration:none;border:1px solid #E8E4DE;padding:16px 32px;transition:background-color .2s,color .2s}
.f1-back:hover,.f1-back:focus-visible{background:#E8E4DE;color:#0A0A0A;outline:none}
.f1-backwrap{text-align:center;margin-top:56px}
@media(min-width:900px){
 .f1-wrap{padding:140px 48px 96px}
 .f1-grid{grid-template-columns:1fr 1fr}
 .f1-grid .f1-stat:nth-child(odd){padding-right:40px;border-right:1px solid #1A1A1A}
 .f1-grid .f1-stat:nth-child(even){padding-left:40px}
 .f1-tl{grid-template-columns:repeat(3,1fr);border-left:none}
 .f1-tl li{border-left:none;border-top:1px solid #E8E4DE;padding:40px 24px 32px 0;margin-top:-1px}
 .f1-tl li::before{left:0;top:-5px}
}
`;

function StatBlock({ stat, i }: { stat: Stat; i: number }) {
  const wide = stat.segments.length > 1 || stat.segments.some((s) => s.kind === "number" && s.number.value >= 1000000);
  return (
    <Reveal delay={(i % 2) * 80} className={`f1-stat${stat.red ? " f1-red" : ""}`}>
      <div data-testid={`stat-${stat.id}`}>
        <span className={`f1-num${wide ? " wide" : ""}`}>
          {stat.segments.map((s, k) =>
            s.kind === "number" ? (
              <AnimatedNumber key={k} value={s.number.value} decimals={s.number.decimals ?? 0} prefix={s.number.prefix} suffix={s.number.suffix} duration={1200} />
            ) : (
              <span key={k}>{s.text}</span>
            ),
          )}
        </span>
        <p className="f1-label">{stat.label}</p>
        {stat.note && <p className="f1-note">{stat.note}</p>}
      </div>
    </Reveal>
  );
}

export default function Fase1Page() {
  const { header, body, sections, closing } = FASE1_DATA;
  return (
    <main className="f1">
      <style>{CSS}</style>
      <div className="f1-wrap">
        <header>
          <Reveal><p className="f1-label">{header.label}</p></Reveal>
          <Reveal delay={80}><h1 className="f1-title">{header.title}</h1></Reveal>
          <Reveal delay={160}><p className="f1-intro">{header.intro}</p></Reveal>
        </header>

        <section className="f1-sec" aria-labelledby="f1-corpo">
          <h2 id="f1-corpo" className="f1-h2">{body.title}</h2>
          <ol className="f1-tl">
            {body.timeline.map((step, i) => (
              <li key={step.label}>
                <Reveal delay={i * 120}>
                  <p className="f1-label">{step.label}</p>
                  <span className="f1-num" style={{ marginTop: 12 }} data-testid={`stat-peso-${i}`}>
                    <AnimatedNumber value={step.value} decimals={step.decimals} duration={1200} />
                    <span className="f1-unit">{step.unit}</span>
                  </span>
                </Reveal>
              </li>
            ))}
          </ol>
          <Reveal><p className="f1-tl-note">{body.note}</p></Reveal>
        </section>

        {sections.map((sec) => (
          <section key={sec.id} className="f1-sec" aria-labelledby={`f1-${sec.id}`}>
            <h2 id={`f1-${sec.id}`} className="f1-h2">{sec.title}</h2>
            <div className="f1-grid">
              {sec.stats.map((s, i) => <StatBlock key={s.id} stat={s} i={i} />)}
            </div>
          </section>
        ))}

        <section className="f1-close" aria-label="Chiusura">
          <Reveal>
            <figure className="f1-quote">
              <blockquote style={{ margin: 0 }}><p>{closing.quote}</p></blockquote>
              <figcaption className="f1-label">{closing.caption}</figcaption>
            </figure>
          </Reveal>
          <Reveal><p className="f1-again">{closing.text}</p></Reveal>
          <Reveal><p className="f1-nika">{closing.finalLine}</p></Reveal>
          <div className="f1-backwrap">
            <Link href="/" className="f1-back" data-testid="link-home">{closing.backLink}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
