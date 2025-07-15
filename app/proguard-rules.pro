# ProGuard rules for the message forwarding app

# Keep the main activity
-keep public class com.messageforwarder.MainActivity {
    public <init>();
}

# Keep data models
-keep class com.messageforwarder.data.models.** { *; }

# Keep repositories
-keep class com.messageforwarder.data.repositories.** { *; }

# Keep services
-keep class com.messageforwarder.services.** { *; }

# Keep UI fragments
-keep class com.messageforwarder.ui.** { *; }

# Keep utils
-keep class com.messageforwarder.utils.** { *; }

# Keep the AndroidManifest
-keep class * extends android.app.Application {
    public <init>();
}

# Keep all annotations
-keepattributes *Annotation*

# Prevent obfuscation of public methods
-keep public class * {
    public protected *;
}