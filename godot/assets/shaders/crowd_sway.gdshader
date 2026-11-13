shader_type spatial;

uniform float sway_speed = 2.4;
uniform float sway_amp = 0.08;

void vertex() {
	float phase = TIME * sway_speed + float(INSTANCE_ID) * 0.73;
	VERTEX.y += abs(sin(phase)) * sway_amp;
	VERTEX.x += cos(phase * 0.5) * (sway_amp * 0.4);
}

void fragment() {
	ALBEDO = COLOR.rgb;
	ROUGHNESS = 0.85;
}
