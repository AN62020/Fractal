#version 300 es
precision highp float;

uniform float uTime;
uniform float uSpeed;
uniform sampler2D uSampler;
uniform float CX;
uniform float CY;
uniform float Zoom;

out vec4 oColor;

float Juilia( vec2 C, vec2 Z )
{
  vec2 C0 = C;
  float n = 0.0;
  float moduleC = 0.0;

  for(float j = 0.0; j < 255.0; j++)
  {
    C0 = vec2(C0.x * C0.x - C0.y * C0.y, C0.y * C0.x + C0.x * C0.y) + Z;
    moduleC = C0.x * C0.x + C0.y * C0.y;

    if (moduleC >= 8.0)
    {
      n = j;
      break;
    }
  }
  return n / 255.;
}
void main(void)
{
  float n;
  vec2 C = vec2(0.35, 0.38);
  vec2 Z;

  C.x = sin(uTime / 3. * uSpeed);
  C.y = sin(uTime / 3. * uSpeed);
  Z = (((gl_FragCoord.xy) / 120.0 - vec2(1.0) + vec2(CY, CX) * 2.) * Zoom);
  Z = fract(Z / 4. + .5) * 4. - 2.;
  n = Juilia(Z, C);
  oColor = texture(uSampler, vec2(n, 1. - n));
  // oColor = vec4(n * 20.0, n * 20.0, n * 20.0, 1.);
}