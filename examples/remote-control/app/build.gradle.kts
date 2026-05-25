plugins {
    id("com.android.application")
}

android {
    namespace = "com.mto3clone"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.mto3clone"
        minSdk = 21
        targetSdk = 34
        // versionCode auto-derived from CI run number (so each push installs over previous)
        versionCode = (System.getenv("GITHUB_RUN_NUMBER") ?: "5").toInt()
        versionName = "3.9.5"
    }

    signingConfigs {
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("debug")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        viewBinding = false
    }

    packaging {
        resources {
            excludes += listOf("META-INF/DEPENDENCIES", "META-INF/LICENSE", "META-INF/NOTICE")
        }
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.webkit:webkit:1.10.0")

    // Media3 ExoPlayer - kept for HLS adaptive + fallback option
    val media3Version = "1.3.1"
    implementation("androidx.media3:media3-exoplayer:$media3Version")
    implementation("androidx.media3:media3-exoplayer-hls:$media3Version")
    implementation("androidx.media3:media3-exoplayer-dash:$media3Version")
    implementation("androidx.media3:media3-ui:$media3Version")
    implementation("androidx.media3:media3-datasource:$media3Version")
    implementation("androidx.media3:media3-common:$media3Version")
    implementation("androidx.media3:media3-extractor:$media3Version")

    // libVLC for Android - universal codec support (AVI, MOV, AC3, DTS, DivX, ...)
    // Includes FFmpeg + all native ABIs (~30 MB but plays everything)
    implementation("org.videolan.android:libvlc-all:3.6.5")
}
