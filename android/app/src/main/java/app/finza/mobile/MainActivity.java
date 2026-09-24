package app.finza.mobile;

import android.os.Bundle;
import android.webkit.CookieManager;
import com.getcapacitor.BridgeActivity;

/** Finza WebView: third-party cookies for Google, flush on pause, no stale stack. */
public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(null);
    CookieManager cookies = CookieManager.getInstance();
    cookies.setAcceptCookie(true);
    if (this.bridge != null && this.bridge.getWebView() != null) {
      cookies.setAcceptThirdPartyCookies(this.bridge.getWebView(), true);
    }
  }

  @Override
  public void onPause() {
    CookieManager.getInstance().flush();
    super.onPause();
  }
}
