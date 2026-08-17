import { assertEqual } from "./assert.js";
import { escapeHtml } from "../js/ui/escapeHtml.js";

assertEqual(escapeHtml(`& < > " '`), "&amp; &lt; &gt; &quot; &#39;", "all 5 special characters are escaped");

assertEqual(escapeHtml("payments-service.rego"), "payments-service.rego", "a string with no special characters passes through unchanged");

assertEqual(
  escapeHtml(`<img src=x onerror="alert(1)">`),
  "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
  "a realistic malicious filename/description is fully neutralised"
);
