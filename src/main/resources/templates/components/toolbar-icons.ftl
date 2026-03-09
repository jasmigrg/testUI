<#macro render name>
  <#switch name>
    <#case "back">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6L9 12L15 18" /></svg>
      <#break>
    <#case "add">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5V19M5 12H19" /></svg>
      <#break>
    <#case "tools">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5A3.5 3.5 0 1 1 12 15.5A3.5 3.5 0 0 1 12 8.5Z" /><path d="M19.4 15A1 1 0 0 0 19.6 16.1L19.7 16.2A1 1 0 0 1 18.3 17.6L18.2 17.5A1 1 0 0 0 17.1 17.3A1 1 0 0 0 16.5 18.2V18.5A1 1 0 0 1 14.5 18.5V18.2A1 1 0 0 0 13.9 17.3A1 1 0 0 0 12.8 17.5L12.7 17.6A1 1 0 0 1 11.3 16.2L11.4 16.1A1 1 0 0 0 11.6 15A1 1 0 0 0 10.7 14.4H10.4A1 1 0 0 1 10.4 12.4H10.7A1 1 0 0 0 11.6 11.8A1 1 0 0 0 11.4 10.7L11.3 10.6A1 1 0 0 1 12.7 9.2L12.8 9.3A1 1 0 0 0 13.9 9.1A1 1 0 0 0 14.5 8.2V7.9A1 1 0 0 1 16.5 7.9V8.2A1 1 0 0 0 17.1 9.1A1 1 0 0 0 18.2 9.3L18.3 9.2A1 1 0 0 1 19.7 10.6L19.6 10.7A1 1 0 0 0 19.4 11.8A1 1 0 0 0 20.3 12.4H20.6A1 1 0 0 1 20.6 14.4H20.3A1 1 0 0 0 19.4 15Z" /></svg>
      <#break>
    <#case "disable">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="6" width="14" height="12" rx="2" /><path d="M9 9L15 15M15 9L9 15" /></svg>
      <#break>
    <#case "update">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 3V7M16 3V7M4 10H20M8 14H12" /></svg>
      <#break>
    <#case "refresh">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12A8 8 0 1 1 17.6 6.2" /><path d="M20 4V10H14" /></svg>
      <#break>
    <#case "execute">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20L16.5 16.5" /></svg>
      <#break>
    <#case "delete">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6H19M9 6V4H15V6M8 6V19H16V6" /></svg>
      <#break>
    <#case "save">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4H17L20 7V20H5Z" /><path d="M8 4V10H16V4" /></svg>
      <#break>
    <#case "submit">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12L12 5L19 12" /></svg>
      <#break>
    <#case "heart">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20L4.7 12.7A4.8 4.8 0 1 1 11.5 5.9L12 6.4L12.5 5.9A4.8 4.8 0 1 1 19.3 12.7L12 20Z" /></svg>
      <#break>
  </#switch>
</#macro>
