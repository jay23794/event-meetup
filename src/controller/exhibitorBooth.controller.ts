import { Request, Response } from "express";
import { exhibitorBoothService } from "../infra/container";
import { ExhibitorDocument } from "../model/exhibitorDocument.model";
import { successResponse } from "../utils/ApiResponse";

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        name: string;
        role: "admin" | "user";
    };
}

export const listByEvent = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId || !eventId) {
        throw new Error("Unauthorized");
    }

    const booths = await exhibitorBoothService.listByEvent(
        userId,
        eventId
    );

    res.status(200).json(
        successResponse({ booths })
    );
};

export const getBoothByQrId = async (
    req: Request,
    res: Response
) => {
    const { qrId } = req.params;

    if (!qrId) {
        throw new Error("QR ID is required");
    }

    const booth = await exhibitorBoothService.getBoothByQrId(
        qrId
    );

    res.status(200).json(
        successResponse({ booth })
    );
};

export const checkInVisitor = async (
    req: Request,
    res: Response
) => {
    const { qrId } = req.params;

    const { name, email, phone } = req.body;

    console.log("[CheckIn-Controller] incoming request", {
        qrId,
        hasName: !!name,
        hasEmail: !!email,
        hasPhone: !!phone,
        hasAuthHeader: !!req.headers.authorization,
    });

    if (!qrId || !name || !email) {
        console.log("[CheckIn-Controller] FAIL: missing fields", {
            qrId,
            name,
            email,
        });

        throw new Error(
            "QR ID, name, and email are required"
        );
    }

    const authToken =
        req.headers.authorization?.replace(
            "Bearer ",
            ""
        );

    const result =
        await exhibitorBoothService.checkInVisitor(
            qrId,
            {
                name,
                email,
                phone,
            },
            authToken
        );

    console.log(
        "[CheckIn-Controller] success response",
        {
            alreadyCheckedIn:
                result.alreadyCheckedIn,
        }
    );

    res.status(200).json(
        successResponse(result)
    );
};

export const listPublicDocuments = async (
    req: Request,
    res: Response
) => {
    const { qrId } = req.params;

    if (!qrId) {
        throw new Error("QR ID is required");
    }

    const booth =
        await exhibitorBoothService.getBoothByQrId(
            qrId
        );

    const documents =
        await ExhibitorDocument.find({
            exhibitorBoothId: booth._id,
            isPublic: true,
        });

    res.status(200).json(
        successResponse({
            documents,
        })
    );
};

export const createEventWithBoothAndDocuments = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.user?.id;

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const result =
        await exhibitorBoothService.createEventWithBoothAndDocuments(
            userId,
            req.body
        );

    res.status(201).json(
        successResponse(result)
    );
};