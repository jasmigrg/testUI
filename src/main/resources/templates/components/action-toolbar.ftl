<#macro render
  actions=[]
  toolbarLabel="Grid actions"
  showRightSection=true
  rightSectionLabel="Grid manager view actions"
>
  <section class="gt-grid-controls">
    <div class="gt-action-toolbar" role="toolbar" aria-label="${toolbarLabel}">
      <#list actions as action>
        <#if (action.visible!true)>
          <button
            type="button"
            class="gt-action-btn ${(action.className)!}"
            aria-label="${(action.ariaLabel)!(action.label)!}"
            data-action="${(action.id)!}"
            <#if (action.disabled)!false>disabled</#if>
          >
            ${(action.iconHtml)!}
            <#if !((action.iconOnly)!false)>
              <span>${(action.label)!}</span>
            </#if>
          </button>
        </#if>
      </#list>
    </div>

    <#if showRightSection>
      <div class="gt-grid-manager-tools" role="toolbar" aria-label="${rightSectionLabel}">
        <#nested>
      </div>
    </#if>
  </section>
</#macro>
