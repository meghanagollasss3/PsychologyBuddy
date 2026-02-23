import { NextRequest, NextResponse } from "next/server";
import { MusicStudentService } from "../services/music.student.service";
import {
  StudentGetMusicResourcesSchema,
  StudentGetFeaturedMusicSchema,
  StudentGetMusicInstructionsSchema,
  GetSingleMusicResourceSchema,
  GetSingleMusicInstructionSchema,
} from "../validators/music.validators";

const musicStudentService = new MusicStudentService();

// ====================================
//        MUSIC RESOURCE CONTROLLERS
// ====================================

export async function getMusicResources(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());
    const validatedData = StudentGetMusicResourcesSchema.parse(queryData);

    // Add user context
    const contextData = {
      ...validatedData,
      // Don't pass schoolId placeholder - let repository handle null schoolId
    };

    const result = await musicStudentService.getMusicResources(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function getMusicResourceById(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());
    const validatedData = GetSingleMusicResourceSchema.parse(queryData);

    const result = await musicStudentService.getMusicResourceById(validatedData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function getMusicByCategory(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());

    // Validate required category parameter
    if (!queryData.category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category parameter is required",
        },
        { status: 400 }
      );
    }

    // Add user context
    const contextData = {
      category: queryData.category,
      goal: queryData.goal,
      schoolId: "school_id", // This should come from user context
      page: queryData.page ? parseInt(queryData.page) : 1,
      limit: queryData.limit ? parseInt(queryData.limit) : 20,
    };

    const result = await musicStudentService.getMusicByCategory(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function getMusicByGoal(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());

    // Validate required goal parameter
    if (!queryData.goal) {
      return NextResponse.json(
        {
          success: false,
          message: "Goal parameter is required",
        },
        { status: 400 }
      );
    }

    // Add user context
    const contextData = {
      goal: queryData.goal,
      category: queryData.category,
      schoolId: "school_id", // This should come from user context
      page: queryData.page ? parseInt(queryData.page) : 1,
      limit: queryData.limit ? parseInt(queryData.limit) : 20,
    };

    const result = await musicStudentService.getMusicByGoal(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function getFeaturedMusic(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());
    const validatedData = StudentGetFeaturedMusicSchema.parse(queryData);

    // Add user context
    const contextData = {
      ...validatedData,
      // Don't pass schoolId placeholder - let repository handle null schoolId
    };

    const result = await musicStudentService.getFeaturedMusic(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

// ====================================
//      MUSIC INSTRUCTION CONTROLLERS
// ====================================

export async function getMusicInstructions(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());
    const validatedData = StudentGetMusicInstructionsSchema.parse(queryData);

    // Add user context
    const contextData = {
      ...validatedData,
      // Don't pass schoolId placeholder - let repository handle null schoolId
    };

    const result = await musicStudentService.getMusicInstructions(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function getMusicInstructionById(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());
    const validatedData = GetSingleMusicInstructionSchema.parse(queryData);

    const result = await musicStudentService.getMusicInstructionById(validatedData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 404 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function getMusicInstructionsByDifficulty(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());

    // Validate required difficulty parameter
    if (!queryData.difficulty) {
      return NextResponse.json(
        {
          success: false,
          message: "Difficulty parameter is required",
        },
        { status: 400 }
      );
    }

    // Validate difficulty value
    const validDifficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
    if (!validDifficulties.includes(queryData.difficulty)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid difficulty level. Must be one of: BEGINNER, INTERMEDIATE, ADVANCED",
        },
        { status: 400 }
      );
    }

    // Add user context
    const contextData = {
      difficulty: queryData.difficulty,
      schoolId: "school_id", // This should come from user context
      page: queryData.page ? parseInt(queryData.page) : 1,
      limit: queryData.limit ? parseInt(queryData.limit) : 20,
    };

    const result = await musicStudentService.getMusicInstructionsByDifficulty(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function getMusicInstructionsByResource(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());

    // Validate required resourceId parameter
    if (!queryData.resourceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Resource ID parameter is required",
        },
        { status: 400 }
      );
    }

    const contextData = {
      resourceId: queryData.resourceId,
      page: queryData.page ? parseInt(queryData.page) : 1,
      limit: queryData.limit ? parseInt(queryData.limit) : 20,
    };

    const result = await musicStudentService.getMusicInstructionsByResource(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

// ====================================
//        MUSIC DISCOVERY CONTROLLERS
// ====================================

export async function getMusicCategories(request: NextRequest) {
  try {
    const result = await musicStudentService.getMusicCategories();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve music categories",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function getMusicGoals(request: NextRequest) {
  try {
    const result = await musicStudentService.getMusicGoals();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve music goals",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function searchMusic(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());

    // Validate required query parameter
    if (!queryData.query) {
      return NextResponse.json(
        {
          success: false,
          message: "Search query parameter is required",
        },
        { status: 400 }
      );
    }

    // Add user context
    const contextData = {
      query: queryData.query,
      schoolId: "school_id", // This should come from user context
      page: queryData.page ? parseInt(queryData.page) : 1,
      limit: queryData.limit ? parseInt(queryData.limit) : 20,
    };

    const result = await musicStudentService.searchMusic(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function getRecommendedMusic(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());

    // Add user context
    const contextData = {
      ...queryData,
      schoolId: "school_id", // This should come from user context
      limit: queryData.limit ? parseInt(queryData.limit) : 10,
    };

    const result = await musicStudentService.getRecommendedMusic(contextData);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("Controller error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request parameters",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
