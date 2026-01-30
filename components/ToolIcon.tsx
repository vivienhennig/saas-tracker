import React, { useState } from 'react';

interface ToolIconProps {
    name: string;
    url?: string;
    className?: string;
}

export const ToolIcon: React.FC<ToolIconProps> = ({ name, url, className = '' }) => {
    const [imgSource, setImgSource] = useState<'clearbit' | 'google' | 'fallback'>('clearbit');

    // Helper to extract domain from URL or name
    const getDomain = () => {
        if (url) {
            try {
                return new URL(url).hostname;
            } catch (e) { /* ignore */ }
        }

        // Common tool mapping
        const commonDomains: { [key: string]: string } = {
            'slack': 'slack.com',
            'spotify': 'spotify.com',
            'linear': 'linear.app',
            'notion': 'notion.so',
            'figma': 'figma.com',
            'github': 'github.com',
            'gitlab': 'gitlab.com',
            'google': 'google.com',
            'aws': 'aws.amazon.com',
            'vercel': 'vercel.com',
            'netlify': 'netlify.com',
            'heroku': 'heroku.com',
            'digitalocean': 'digitalocean.com',
            'adobe': 'adobe.com',
            'microsoft': 'microsoft.com',
            'apple': 'apple.com',
            'zoom': 'zoom.us',
            'trello': 'trello.com',
            'jira': 'atlassian.com',
            'asana': 'asana.com',
            'monday': 'monday.com',
            'clickup': 'clickup.com',
            'airtable': 'airtable.com',
            'intercom': 'intercom.com',
            'hubspot': 'hubspot.com',
            'salesforce': 'salesforce.com',
            'mailchimp': 'mailchimp.com',
            'stripe': 'stripe.com',
            'paypal': 'paypal.com',
            'shopify': 'shopify.com',
            'wordpress': 'wordpress.com',
            'webflow': 'webflow.com',
            'framer': 'framer.com',
            'discord': 'discord.com',
            'whatsapp': 'whatsapp.com',
            'telegram': 'telegram.org',
            'signal': 'signal.org',
            'skype': 'skype.com',
            'teams': 'microsoft.com',
            'chatgpt': 'openai.com',
            'openai': 'openai.com',
            'claude': 'anthropic.com',
            'gemini': 'deepmind.google',
            'copilot': 'github.com',
            'midjourney': 'midjourney.com',
            'netflix': 'netflix.com',
            'prime': 'amazon.com',
            'disney': 'disneyplus.com',
            'hulu': 'hulu.com',
            'hbo': 'hbo.com',
            'youtube': 'youtube.com',
            'twitch': 'twitch.tv',
            'vimeo': 'vimeo.com',
            'soundcloud': 'soundcloud.com',
            'audible': 'audible.com',
            'kindle': 'amazon.com',
            'dropbox': 'dropbox.com',
            'box': 'box.com',
            'drive': 'google.com',
            'icloud': 'apple.com',
            'onedrive': 'microsoft.com',
            '1password': '1password.com',
            'lastpass': 'lastpass.com',
            'bitwarden': 'bitwarden.com',
            'dashlane': 'dashlane.com',
            'proton': 'proton.me',
            'mullvad': 'mullvad.net',
            'nordvpn': 'nordvpn.com',
            'expressvpn': 'expressvpn.com',
            'surfshark': 'surfshark.com',
            'adobecc': 'adobe.com',
            'photoshop': 'adobe.com',
            'illustrator': 'adobe.com',
            'indesign': 'adobe.com',
            'premiere': 'adobe.com',
            'aftereffects': 'adobe.com',
            'lightroom': 'adobe.com',
            'canva': 'canva.com'
        };

        const cleanName = name.toLowerCase().trim();

        // Exact match in map
        if (commonDomains[cleanName]) return commonDomains[cleanName];

        // Partial match for known brands (e.g. "Slack Team" -> "slack")
        for (const key of Object.keys(commonDomains)) {
            if (cleanName.includes(key)) return commonDomains[key];
        }

        // Fallback: guess .com
        return `${cleanName.replace(/[^a-z0-9]/g, '')}.com`;
    };

    const domain = getDomain();

    // Construct URLs
    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    return (
        <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
            {imgSource === 'clearbit' && (
                <img
                    src={clearbitUrl}
                    alt={`${name} logo`}
                    className="w-full h-full object-cover"
                    onError={() => setImgSource('google')}
                />
            )}

            {imgSource === 'google' && (
                <img
                    src={googleUrl}
                    alt={`${name} favicon`}
                    className="w-full h-full object-cover"
                    onError={() => setImgSource('fallback')}
                />
            )}

            {imgSource === 'fallback' && (
                <span className="font-black text-lg select-none">
                    {name.charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    );
};
