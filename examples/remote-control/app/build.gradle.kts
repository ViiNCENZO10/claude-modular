plugins {
    // Versions resolues via settings.gradle.kts pluginManagement
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    // Nouveau Compose Compiler Plugin (Kotlin 2.0+) - resout auto les conflits
    id("org.jetbrains.kotlin.plugin.compose")
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
        versionName = "4.2.1"
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

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
        // Compose active via le NOUVEAU plugin Kotlin 2.0+ (resout les conflits automatiquement)
        compose = true
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

    // === Native Android UI : Kotlin + XML (Phase 1 actuelle) + Compose (Phase 1bis ajoute) ===
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("com.google.android.material:material:1.11.0")

    // === Jetpack Compose (via BOM 2024.12.01 + plugin Kotlin 2.0+) ===
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")


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
