import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AnimatedReportCard = ({
  title,
  subtitle,
  description,
  icon: Icon,
  navigateTo,
  hoverBg,
  textColor,
  iconColor,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="
        w-full
        md:aspect-square   /* ✅ square on md+ */
      "
    >
      <Card
        onClick={() => navigate(navigateTo)}
        className={`
           w-full
          cursor-pointer
          transition-all
          hover:shadow-lg
          ${hoverBg}
        `}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>

          <motion.div
            whileHover={{ rotate: 15, scale: 1.2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </motion.div>
        </CardHeader>

        <CardContent className="flex flex-col justify-center h-full">
          <motion.div
            initial={{ y: 6, opacity: 0.8 }}
            whileHover={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`text-xl font-bold ${textColor}`}
          >
            {subtitle}
          </motion.div>

          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnimatedReportCard;
