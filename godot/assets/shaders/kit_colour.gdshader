shader_type spatial;

uniform vec4 primary_color : source_color = vec4(0.06, 0.50, 0.35, 1.0);
uniform vec4 secondary_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float stripe_mix : hint_range(0.0, 1.0) = 0.0;
uniform float sweat_amount : hint_range(0.0, 1.0) = 0.1;

void fragment() {
	float s = step(0.5, fract(UV.x * 6.0)) * stripe_mix;
	ALBEDO = mix(primary_color.rgb, secondary_color.rgb, s);
	ROUGHNESS = mix(0.75, 0.35, sweat_amount);
}
