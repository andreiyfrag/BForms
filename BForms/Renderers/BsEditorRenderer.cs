using BForms.Editor;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace BForms.Renderers
{
    public class BsEditorRenderer<TModel> : BsBaseRenderer<BsEditorHtmlBuilder<TModel>>
    {
        public BsEditorRenderer(){}

        public BsEditorRenderer(BsEditorHtmlBuilder<TModel> builder)
            : base(builder)
        { 

        }

        public override string Render()
        {
            var result = this.Builder.IsAjaxRequest() ?
                this.RenderAjax() :
                this.RenderIndex();
            return result;
        }

        public string RenderAjax()
        {
            var result = "";

            foreach (var tab in this.Builder.TabConfigurator.Tabs)
            {
                if (tab.Value.HasModel)
                {
                    result += tab.Value.renderer.RenderAjax();
                }
            }

            return result;
        }

        public string RenderTabs()
        {
            var result = this.Builder.TabConfigurator.NavigationBuilder.ToString();

            foreach (var tab in this.Builder.TabConfigurator.Tabs)
            {
                result += tab.Value.ToString();
            }

            return result;
        }

        public string RenderGroups()
        {
            var div = new TagBuilder("div");

            div.AddCssClass("grid_view");

            foreach (var group in this.Builder.GroupConfigurator.Groups)
            {
                div.InnerHtml += group.Value.ToString();
            }

            return div.ToString();
        }

        public string RenderGroupsFooter()
        {
            var counter = new TagBuilder("div");

            counter.AddCssClass("row counter");

            var total = new TagBuilder("div");

            total.AddCssClass("col-lg-6 col-md-6 col-sm-6");

            var span = new TagBuilder("span");

            span.AddCssClass("bs-counter");

            total.InnerHtml += "Total: " + span;

            counter.InnerHtml += total;

            var reset = new TagBuilder("div");

            reset.AddCssClass("col-lg-6 col-md-6 col-sm-6");

            var anchor = new TagBuilder("a");

            anchor.MergeAttribute("href", "#");

            anchor.AddCssClass("btn btn-white pull-right");

            anchor.InnerHtml += GetGlyphicon(Models.Glyphicon.Refresh);

            anchor.InnerHtml += " " + "Reset";

            reset.InnerHtml += anchor;

            counter.InnerHtml += reset;

            return counter.ToString();
        }

        public string RenderIndex()
        {
            var container = new TagBuilder("div");

            container.AddCssClass("group_editor");

            if (this.Builder.htmlAttributes != null)
            {
                container.MergeAttributes(this.Builder.htmlAttributes);
            }

            #region Left
            var left = new TagBuilder("div");

            left.AddCssClass("left bs-tabs");

            left.InnerHtml += RenderTabs();

            container.InnerHtml += left;
            #endregion

            #region Right
            var right = new TagBuilder("div");

            right.AddCssClass("right bs-groups");

            right.InnerHtml += RenderGroups();

            right.InnerHtml += RenderGroupsFooter();

            container.InnerHtml += right;
            #endregion

            return container.ToString();
        }
    }
}
