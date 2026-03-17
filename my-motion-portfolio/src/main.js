document.querySelector('#app').innerHTML = `
  <div style="font-family: 'Inter', sans-serif; text-align: center; margin-top: 10vh; color: #333; max-width: 600px; margin-left: auto; margin-right: auto; padding: 20px;">
    <h1 style="color: #ff4444; font-size: 24px; margin-bottom: 20px;">⚠️ Deployment Configuration Issue</h1>
    <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You are seeing the default Vite starter page because the <strong>wrong directory</strong> was deployed or built.
        </p>
        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            It appears you have deployed the <code>my-motion-portfolio</code> subdirectory directly, or Netlify has auto-detected it as the project root.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <h3 style="font-size: 18px; margin-bottom: 15px;">How to Fix on Netlify:</h3>
        <ul style="text-align: left; font-size: 14px; line-height: 1.6; color: #444; padding-left: 20px;">
            <li><strong>Base directory:</strong> Set to <code>/</code> (root)</li>
            <li><strong>Build command:</strong> Set to <code>npm run build</code></li>
            <li><strong>Publish directory:</strong> Set to <code>dist</code></li>
        </ul>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">
            (A <code>netlify.toml</code> file has been added to the root to help automate this configuration.)
        </p>
    </div>
  </div>
`
