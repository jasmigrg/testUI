<#macro render
  showDensity=true
  defaultDensity="compact"
  showDownload=true
>
  <div class="gt-view-actions">
    <#if showDensity>
      <button type="button" class="gt-view-btn <#if defaultDensity == 'comfortable'>is-active</#if>" data-density="comfortable" aria-label="Comfortable rows" title="Comfortable rows">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6H21M3 12H21M3 18H21" />
        </svg>
      </button>

      <button type="button" class="gt-view-btn <#if defaultDensity == 'compact'>is-active</#if>" data-density="compact" aria-label="Compact rows" title="Compact rows">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6H21M3 12H21M3 18H21" />
        </svg>
      </button>

      <button type="button" class="gt-view-btn <#if defaultDensity == 'spacious'>is-active</#if>" data-density="spacious" aria-label="Spacious rows" title="Spacious rows">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 7H21M3 12H21M3 17H21" />
        </svg>
      </button>
    </#if>

    <#if showDensity && showDownload>
      <span class="gt-view-divider" aria-hidden="true"></span>
    </#if>

    <#if showDownload>
      <button type="button" class="gt-view-btn" data-action="download" aria-label="Download CSV" title="Download CSV">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3V15" />
          <path d="M7 10L12 15L17 10" />
          <path d="M4 20H20" />
        </svg>
      </button>
    </#if>
  </div>
</#macro>
