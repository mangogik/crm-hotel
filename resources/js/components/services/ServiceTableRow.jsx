import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pencil,
    Trash2,
    ChevronDown,
    ChevronRight,
    Info,
    CheckCircle,
    List,
    HelpCircle,
    Images,
} from "lucide-react";
import { Link } from "@inertiajs/react";

const ServiceTableRow = ({
    service,
    isExpanded,
    onToggle,
    // onEdit, // (Ini sudah dihapus dengan benar)
    onDelete,
    onOpenImages,
    formatPrice,
    getTypeBadge,
    getFulfillmentBadge,
    getOfferingSessionBadge,
}) => {
    const isMultiSelect = service.type === "multiple_options";

    const renderPrice = () => {
        if (service.type === "selectable" || isMultiSelect) {
            return (
                <div className="flex items-center gap-1">
                    <span className="text-sm">Multiple options</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                </div>
            );
        }
        if (!service.price || Number(service.price) === 0) {
            return (
                <span className="inline-flex text-xs font-medium px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">
                    Free
                </span>
            );
        }
        return <span className="font-medium">{formatPrice(service.price)}</span>;
    };

    const renderCategory = () => {
        if (service.category) {
            return (
                <Badge variant="outline" className="text-xs">
                    {service.category.name}
                </Badge>
            );
        }
        return <span className="text-muted-foreground text-sm">None</span>;
    };

    const hasQuestions =
        service.has_active_questions &&
        service.active_question?.questions_json?.length > 0;

    const hasOptions =
        (service.type === "selectable" || isMultiSelect) &&
        Array.isArray(service.options) &&
        service.options.length > 0;

    const FewOptionsChips = ({ options }) => (
        <div className="flex flex-wrap gap-2">
            {options.map((o, i) => (
                <Badge
                    key={i}
                    variant="outline"
                    className="text-xs px-2 py-1 flex flex-col items-start"
                >
                    <span className="mr-1 font-medium">{o.name}</span>
                    <span className="text-muted-foreground">
                        {formatPrice(o.price)}
                    </span>
                </Badge>
            ))}
        </div>
    );

    const ManyOptionsTable = ({ options }) => (
        <div className="rounded-md border bg-background">
            <ScrollArea className="max-h-56">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="py-2">Option</TableHead>
                            <TableHead className="py-2 text-right">Price</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {options.map((option, index) => (
                            <TableRow key={index}>
                                <TableCell className="text-sm py-2">
                                    {option.name}
                                </TableCell>
                                <TableCell className="text-right font-medium py-2">
                                    {formatPrice(option.price)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );

    const QuestionsInline = ({ questions }) => (
        <ol className="list-decimal ml-4 space-y-1">
            {questions.map((q, i) => (
                <li key={i} className="text-sm">
                    {q}
                </li>
            ))}
        </ol>
    );

    const QuestionsScrollable = ({ questions }) => (
        <div className="rounded-md border bg-background">
            <ScrollArea className="max-h-56 p-3">
                <ol className="list-decimal ml-4 space-y-1">
                    {questions.map((q, i) => (
                        <li key={i} className="text-sm">
                            {q}
                        </li>
                    ))}
                </ol>
            </ScrollArea>
        </div>
    );

    // decide rendering modes
    const fewOptions = hasOptions && service.options.length <= 4;
    const manyOptions = hasOptions && service.options.length > 4;
    const questions = service.active_question?.questions_json ?? [];
    const hasQuestionsFew = hasQuestions && questions.length <= 5;
    const hasQuestionsMany = hasQuestions && questions.length > 5;
    const hasOnlyServiceInfo = !hasOptions && !hasQuestions;

    return (
        <>
            <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onToggle}>
                <TableCell>
                    <Button variant="ghost" size="sm">
                        {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </Button>
                </TableCell>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{getTypeBadge(service.type, service.unit_name)}</TableCell>
                <TableCell>
                    {getFulfillmentBadge(service.fulfillment_type)}
                </TableCell>
                <TableCell>
                    {getOfferingSessionBadge(service.offering_session)}
                </TableCell>
                <TableCell>{renderCategory()}</TableCell>
                <TableCell>{renderPrice()}</TableCell>
                <TableCell>
                    {hasQuestions ? (
                        <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                        >
                            <CheckCircle className="h-3 w-3" />
                            Questions
                        </Badge>
                    ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                    )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                        {/* --- Tombol Edit (Sudah Benar) --- */}
                        <Button
                            asChild 
                            variant="ghost"
                            size="sm"
                            className="bg-secondary text-secondary-foreground"
                        >
                            <Link
                                href={route("services.edit", service.id)}
                                onClick={(e) => e.stopPropagation()} 
                            >
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                        {/* --- Akhir Tombol Edit --- */}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="bg-destructive text-destructive-foreground"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>

            {isExpanded && (
                <TableRow key={`${service.id}-details`}>
                    <TableCell colSpan={9} className="p-0">
                        <div className="p-3">
                            {/* Header (View Images) */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="text-xs text-muted-foreground leading-tight">
                                    <div className="font-medium text-sm text-foreground">
                                        {service.name}
                                    </div>
                                    <div className="mt-0.5">ID #{service.id}</div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenImages(service);
                                    }}
                                >
                                    <Images className="h-4 w-4" />
                                    View Images
                                </Button>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                
                                <div className="bg-white rounded-md border shadow-sm p-3 md:col-span-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-indigo-100 p-1.5 rounded-full">
                                            <Info className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <h3 className="text-sm font-semibold">
                                            Service Info
                                        </h3>
                                    </div>

                                    {/* [PERUBAHAN]: 
                                      'max-h-56 overflow-y-auto pr-2'
                                      Ini membuat kotak info punya tinggi maksimal
                                      dan scroll vertikal, sama seperti kotak lainnya.
                                    */}
                                    <div className="text-sm text-muted-foreground max-h-56 overflow-y-auto pr-2">
                                        {service.description_html ? (
                                            <div
                                                // ===================================================================
                                                // 👇👇👇 PERUBAHAN DI SINI 👇👇👇
                                                // 'whitespace-normal' ditambahkan untuk memaksa text wrapping
                                                // ===================================================================
                                                className="prose prose-sm max-w-none whitespace-normal break-words" 
                                                dangerouslySetInnerHTML={{ __html: service.description_html }}
                                            />
                                            // ===================================================================
                                            // 👆👆👆 AKHIR PERUBAHAN 👆👆👆
                                            // ===================================================================
                                        ) : (
                                            <span>No description.</span>
                                        )}
                                    </div>
                                </div>

                                {/* Middle: Options */}
                                {hasOptions && (
                                    <div className="bg-white rounded-md border shadow-sm p-3 md:col-span-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-green-100 p-1.5 rounded-full">
                                                <List className="h-4 w-4 text-green-600" />
                                            </div>
                                            <h3 className="text-sm font-semibold">
                                                {isMultiSelect
                                                    ? "Available Options (Multi-Select)"
                                                    : "Available Options"}
                                            </h3>
                                            {isMultiSelect && (
                                                <Badge
                                                    variant="outline"
                                                    className="ml-auto bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200"
                                                >
                                                    Multi-Select
                                                </Badge>
                                            )}
                                        </div>

                                        {fewOptions && (
                                            <FewOptionsChips options={service.options} />
                                        )}
                                        {manyOptions && (
                                            <ManyOptionsTable options={service.options} />
                                        )}
                                    </div>
                                )}

                                {/* Right: Custom Questions */}
                                {hasQuestions && (
                                    <div className="bg-white rounded-md border shadow-sm p-3 md:col-span-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="bg-purple-100 p-1.5 rounded-full">
                                                <HelpCircle className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <h3 className="text-sm font-semibold">
                                                Custom Questions
                                            </h3>
                                        </div>

                                        {hasQuestionsFew && (
                                            <QuestionsInline questions={questions} />
                                        )}
                                        {hasQuestionsMany && (
                                            <QuestionsScrollable
                                                questions={questions}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {hasOnlyServiceInfo && (
                                <div className="mt-2 text-xs text-muted-foreground" />
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default ServiceTableRow;