package expo.modules.datascanner

import android.content.Context
import android.graphics.Color
import android.view.Gravity
import android.widget.TextView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/**
 * Android stub view — shows a placeholder until ML Kit + CameraX are wired in.
 */
class ExpoDataScannerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  @Suppress("unused")
  private val onScan by EventDispatcher()

  private val placeholder = TextView(context).apply {
    text = "Android 扫码尚未实现"
    setTextColor(Color.WHITE)
    setBackgroundColor(Color.parseColor("#222222"))
    gravity = Gravity.CENTER
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
  }

  init {
    addView(placeholder)
  }
}
