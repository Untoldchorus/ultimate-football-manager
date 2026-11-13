shader_type spatial;

uniform vec4 grass_light : source_color = vec4(0.09, 0.38, 0.14, 1.0);
uniform vec4 grass_dark : source_color = vec4(0.06, 0.29, 0.10, 1.0);
uniform float stripe_count = 18.0;
uniform float wetness : hint_range(0.0, 1.0) = 0.0;

void fragment() {
	float stripe = step(0.5, fract(UV.x * stripe_count));
	vec3 col = mix(grass_dark.rgb, grass_light.rgb, stripe);
	ALBEDO = col * mix(1.0, 0.78, wetness);
	ROUGHNESS = mix(0.85, 0.28, wetness);
	SPECULAR = mix(0.2, 0.65, wetness);
}
