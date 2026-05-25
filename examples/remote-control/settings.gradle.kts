// Settings minimaliste pour Phase 1 native (Compose via plugin Kotlin 2.0+).
// Force les versions de plugins pour eviter les conflits Kotlin/Compose Compiler.

pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
    plugins {
        // AGP 8.7.3 = compatible avec Kotlin 2.0.21 + JDK 17 + Gradle 8.7
        id("com.android.application") version "8.7.3" apply false
        // Kotlin 2.0.21 + son plugin Compose officiel
        id("org.jetbrains.kotlin.android") version "2.0.21" apply false
        id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "iPremTvOnline"
include(":app")
