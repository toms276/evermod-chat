<?php
/**
 * Plugin Name:       EVERMOD Chat
 * Plugin URI:         https://www.evermod.eu
 * Description:        Adds the EVERMOD AI chat assistant (Orion) to every page of your site, plus the [evermod_thankyou] shortcode for thank-you pages.
 * Version:            1.0.0
 * Author:             EVERMOD
 * Author URI:         https://www.evermod.eu
 * License:            GPL-2.0-or-later
 * Text Domain:        evermod-chat
 */

// No direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'EVERMOD_CHAT_VERSION', '1.0.0' );
define( 'EVERMOD_CHAT_URL', plugin_dir_url( __FILE__ ) );

/**
 * Load the chat widget on every frontend page.
 */
function evermod_chat_enqueue_widget() {
	wp_enqueue_script(
		'evermod-chat-widget',
		EVERMOD_CHAT_URL . 'assets/widget.js',
		array(),
		EVERMOD_CHAT_VERSION,
		true // footer.
	);
}
add_action( 'wp_enqueue_scripts', 'evermod_chat_enqueue_widget' );

/**
 * Add defer attribute to the widget script (works on WP 5.x and 6.x).
 */
function evermod_chat_defer_script( $tag, $handle ) {
	if ( 'evermod-chat-widget' === $handle ) {
		return str_replace( ' src', ' defer src', $tag );
	}
	return $tag;
}
add_filter( 'script_loader_tag', 'evermod_chat_defer_script', 10, 2 );

/**
 * Shortcode: [evermod_thankyou]
 * Renders the thank-you section with two option cards.
 * The cards open the chat widget (EvermodChat.open() / EvermodChat.ask()).
 */
function evermod_chat_thankyou_shortcode() {
	$html  = '<style>';
	$html .= '.evm-ty{background:#141414;color:#fff;padding:70px 24px;text-align:center;font-family:-apple-system,\'Segoe UI\',Roboto,sans-serif}';
	$html .= '.evm-ty h1{font-size:42px;font-weight:700;letter-spacing:.03em;margin:0 0 10px}';
	$html .= '.evm-ty .sub{font-weight:300;opacity:.75;margin:0}';
	$html .= '.evm-next{max-width:900px;margin:50px auto;padding:0 24px;font-family:-apple-system,\'Segoe UI\',Roboto,sans-serif}';
	$html .= '.evm-next h2{font-size:26px;font-weight:700;color:#1a1a1a}';
	$html .= '.evm-grid{display:flex;gap:20px;flex-wrap:wrap;margin-top:18px}';
	$html .= '.evm-card{flex:1;min-width:280px;background:#fff;border:1px solid #e6e4e0;border-radius:12px;padding:28px;text-align:left}';
	$html .= '.evm-card .num{display:inline-flex;width:28px;height:28px;border-radius:50%;background:#1a1a1a;color:#fff;align-items:center;justify-content:center;font-size:13px;font-weight:700;margin-bottom:14px}';
	$html .= '.evm-card h3{font-weight:700;font-size:17px;margin:0 0 8px;color:#1a1a1a}';
	$html .= '.evm-card p{line-height:1.6;color:#555;margin:0 0 18px}';
	$html .= '.evm-card .lnk{background:none;border:none;cursor:pointer;font-size:14px;font-weight:700;color:#1a1a1a;padding:0;display:inline-flex;align-items:center;gap:6px}';
	$html .= '.evm-card .lnk:hover{opacity:.7}';
	$html .= '</style>';

	$html .= '<div class="evm-ty"><h1>THANK YOU!</h1><p class="sub">YOUR INQUIRY HAS BEEN RECEIVED</p></div>';
	$html .= '<div class="evm-next"><h2>What&#39;s next?</h2><div class="evm-grid">';

	$html .= '<div class="evm-card"><span class="num">1</span><h3>Get an Immediate Answer</h3>';
	$html .= '<p>Chat with Orion, our AI assistant, right here &mdash; instant answers about models, floor plans, delivery and warranties.</p>';
	$html .= '<button class="lnk" onclick="EvermodChat.open()">Chat with Orion &rarr;</button></div>';

	$html .= '<div class="evm-card"><span class="num">2</span><h3>Book a Video Call</h3>';
	$html .= '<p>Walk through the designs together with our specialist. Orion will ask a couple of questions and arrange the call.</p>';
	$html .= '<button class="lnk" onclick="EvermodChat.ask(\'I would like to book a video call with a specialist\')">Request a call &rarr;</button></div>';

	$html .= '</div></div>';

	return $html;
}
add_shortcode( 'evermod_thankyou', 'evermod_chat_thankyou_shortcode' );
