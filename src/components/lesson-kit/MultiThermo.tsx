/**
 * MultiThermo — a row of small thermometers with explicit temperature readings.
 *
 * Used as a passive visual above an EquationInput / MultipleChoice (e.g.
 * "Three thermometers reading 120°, 124°, 122° — find the mean").
 *
 * Each entry is rendered as a small thermometer with a bulb, a mercury column
 * matching the temperature, and the value printed above. The visual scale is
 * inferred from the min/max temperature.
 */
export interface MultiThermoSpec {
  values: number[];
  /** Optional fixed range for the column heights; defaults to [min(values)-5, max(values)+5]. */
  min?: number;
  max?: number;
  unit?: string; // e.g. "°"
}

export interface MultiThermoProps {
  spec: MultiThermoSpec;
}

export default function MultiThermo({ spec }: MultiThermoProps) {
  const values = spec.values;
  const lo = spec.min ?? Math.min(...values) - 5;
  const hi = spec.max ?? Math.max(...values) + 5;
  const range = Math.max(1, hi - lo);

  const colH = 110;
  const colW = 14;
  const bulbR = 14;
  const thermoW = 48;
  const thermoH = colH + bulbR * 2 + 28; // top label + col + bulb
  const gap = 18;

  return (
    <div
      className="multithermo-row"
      style={{
        display: "flex",
        justifyContent: "center",
        gap,
        margin: "10px 0 16px",
      }}
    >
      {values.map((v, i) => {
        const pct = Math.max(0, Math.min(1, (v - lo) / range));
        const fillH = pct * colH;
        return (
          <div
            key={i}
            style={{
              width: thermoW,
              height: thermoH,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Value label */}
            <div
              style={{
                fontFamily: "Nunito, sans-serif",
                fontSize: 14,
                fontWeight: 900,
                color: "#1a1a2e",
                marginBottom: 4,
              }}
            >
              {v}
              {spec.unit ?? ""}
            </div>
            {/* Column with mercury */}
            <div
              style={{
                position: "relative",
                width: colW,
                height: colH,
                background: "#fff",
                border: "2px solid #455A64",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: fillH,
                  background: "linear-gradient(to top, #D84315 0%, #FF7043 100%)",
                }}
              />
            </div>
            {/* Bulb */}
            <div
              style={{
                width: bulbR * 2,
                height: bulbR * 2,
                borderRadius: "50%",
                background: "#D84315",
                border: "2px solid #455A64",
                marginTop: -2,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
